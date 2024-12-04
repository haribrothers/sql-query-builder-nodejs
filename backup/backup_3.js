const express = require('express');
const { resolve } = require('path');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('static'));

const validateSQLCondition = (whereClause) => {
  // Remove any leading 'WHERE' keyword if present
  const conditions = whereClause.replace(/^WHERE\s+/i, '').trim();

  if (!conditions) {
    return { isValid: false, error: 'Empty condition' };
  }

  // SQL operators and keywords
  const validOperators = {
    comparison: [
      '=',
      '<>',
      '!=',
      '>',
      '<',
      '>=',
      '<=',
      'LIKE',
      'NOT LIKE',
      'IN',
      'NOT IN',
    ],
    logical: ['AND', 'OR', 'NOT'],
    special: ['BETWEEN', 'NOT BETWEEN', 'IS NULL', 'IS NOT NULL'],
  };

  // SQL injection patterns
  const injectionPatterns = [
    /;\s*$/, // Trailing semicolon
    /;\s*--/, // SQL comment
    /;\s*\/\*.*?\*\//, // Multi-line comment
    /UNION\s+ALL/i,
    /UNION\s+SELECT/i,
    /DROP\s+TABLE/i,
    /ALTER\s+TABLE/i,
    /DELETE\s+FROM/i,
    /INSERT\s+INTO/i,
    /UPDATE\s+\w+\s+SET/i,
    /EXEC\s*\(/i,
    /EXECUTE\s*\(/i,
    /xp_cmdshell/i,
    /sp_executesql/i,
  ];

  // Regular expressions for validation
  const patterns = {
    identifier: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    quotedString: /'[^']*'/,
    number: /^-?\d*\.?\d+$/,
    templateVariable: /\[[A-Z]+\]/,
    whitespace: /\s+/,
  };

  let parenthesesCount = 0;

  try {
    // Check for SQL injection patterns
    for (const pattern of injectionPatterns) {
      if (pattern.test(conditions)) {
        return {
          isValid: false,
          error: 'Potential SQL injection detected',
          pattern: pattern.toString(),
        };
      }
    }

    // Check parentheses matching
    for (const char of conditions) {
      if (char === '(') parenthesesCount++;
      if (char === ')') parenthesesCount--;
      if (parenthesesCount < 0) {
        return {
          isValid: false,
          error: 'Unmatched parentheses: too many closing parentheses',
        };
      }
    }

    if (parenthesesCount !== 0) {
      return {
        isValid: false,
        error: 'Unmatched parentheses: missing closing parenthesis',
      };
    }

    // Tokenize the condition while preserving important whitespace
    const tokens = conditions
      .replace(/\(/g, ' ( ')
      .replace(/\)/g, ' ) ')
      .split(patterns.whitespace)
      .filter((token) => token.trim());

    // Validate tokens
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const prevToken = i > 0 ? tokens[i - 1] : null;
      const nextToken = i < tokens.length - 1 ? tokens[i + 1] : null;

      // Skip parentheses and template variables
      if (
        token === '(' ||
        token === ')' ||
        patterns.templateVariable.test(token)
      ) {
        continue;
      }

      // Check logical operators
      if (validOperators.logical.includes(token.toUpperCase())) {
        if (
          !prevToken ||
          !nextToken ||
          prevToken === '(' ||
          nextToken === ')'
        ) {
          return {
            isValid: false,
            error: `Invalid usage of logical operator: ${token}`,
          };
        }
        continue;
      }

      // Check comparison operators
      if (validOperators.comparison.includes(token.toUpperCase())) {
        if (
          !prevToken ||
          !nextToken ||
          !isValidIdentifierOrValue(prevToken) ||
          !isValidIdentifierOrValue(nextToken)
        ) {
          return {
            isValid: false,
            error: `Invalid comparison: ${prevToken} ${token} ${nextToken}`,
          };
        }
        continue;
      }

      // Check if token is a column name
      if (patterns.identifier.test(token)) {
        // Column names should be followed by an operator
        if (nextToken && !isValidOperator(nextToken)) {
          return {
            isValid: false,
            error: `Invalid operator after column name: ${token} ${nextToken}`,
          };
        }
        continue;
      }

      // Check if token is a value
      if (
        !patterns.quotedString.test(token) &&
        !patterns.number.test(token) &&
        !patterns.templateVariable.test(token)
      ) {
        return {
          isValid: false,
          error: `Invalid value: ${token}`,
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid SQL condition format: ${error.message}`,
    };
  }

  function isValidOperator(token) {
    const upperToken = token.toUpperCase();
    return [
      ...validOperators.comparison,
      ...validOperators.logical,
      ...validOperators.special,
    ].includes(upperToken);
  }

  function isValidIdentifierOrValue(token) {
    return (
      patterns.identifier.test(token) ||
      patterns.quotedString.test(token) ||
      patterns.number.test(token) ||
      patterns.templateVariable.test(token)
    );
  }
};

function buildWhereClause(conditionGroup) {
  if (
    !conditionGroup ||
    !conditionGroup.conditions ||
    conditionGroup.conditions.length === 0
  ) {
    return '';
  }

  const conditions = conditionGroup.conditions.map((item) => {
    if (item.conditions) {
      // It's a nested group
      const nestedClause = buildWhereClause(item);
      return item.isNested ? `(${nestedClause})` : nestedClause;
    } else {
      // It's a single condition
      let value = item.formattedValue;
      if (typeof value === 'string' && !value.startsWith('%')) {
        value = `'${value}'`;
      }
      return `${item.column} ${item.operator} ${value}`;
    }
  });

  return conditions.join(` ${conditionGroup.operator} `);
}

function validateQuery(tableName, fields, whereClause) {
  // Validate table name
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
    return { isValid: false, error: 'Invalid table name' };
  }

  // Validate fields
  if (!Array.isArray(fields) || fields.length === 0) {
    return { isValid: false, error: 'No fields selected' };
  }

  for (const field of fields) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field)) {
      return { isValid: false, error: `Invalid field name: ${field}` };
    }
  }

  // SQL injection check patterns
  const dangerousPatterns = [
    /;\s*$/, // Trailing semicolon
    /;\s*--/, // SQL comment
    /\/\*|\*\//, // Block comments
    /UNION\s+ALL/i,
    /UNION\s+SELECT/i,
    /DROP\s+/i,
    /ALTER\s+/i,
    /DELETE\s+/i,
    /INSERT\s+/i,
    /UPDATE\s+/i,
    /EXEC\s*\(/i,
    /EXECUTE\s*\(/i,
  ];

  // Check for SQL injection in the where clause
  for (const pattern of dangerousPatterns) {
    if (pattern.test(whereClause)) {
      return {
        isValid: false,
        error: 'Potential SQL injection detected',
        pattern: pattern.toString(),
      };
    }
  }

  return { isValid: true };
}

app.get('/', (req, res) => {
  res.sendFile(resolve(__dirname, 'pages/index.html'));
});

app.get('/option2', (req, res) => {
  res.sendFile(resolve(__dirname, 'pages/option2.html'));
});

app.post('/api/validate2', (req, res) => {
  const { condition } = req.body;
  const result = validateSQLCondition(condition);
  res.json(result);
});

app.post('/api/validate', (req, res) => {
  const { tableName, fields, conditions } = req.body;

  try {
    const whereClause = buildWhereClause(conditions);
    const validationResult = validateQuery(tableName, fields, whereClause);

    if (!validationResult.isValid) {
      return res.json(validationResult);
    }

    // Build the complete SQL query
    const query = `SELECT ${fields.join(', ')} 
    FROM ${tableName}
    ${whereClause ? 'WHERE ' + whereClause : ''}`;

    // Return success with the built query
    res.json({
      isValid: true,
      query: query,
      structure: {
        tableName,
        fields,
        whereClause,
      },
    });
  } catch (error) {
    res.json({
      isValid: false,
      error: `Error building query: ${error.message}`,
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
