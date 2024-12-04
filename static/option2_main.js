const availableFields = {
  inquiry: [
    'InqID',
    'user',
    'flagcds',
    'winloss',
    'statuscd',
    'created_at',
    'updated_at',
  ],
  users: ['id', 'username', 'email', 'status', 'created_at'],
  status: ['id', 'name', 'description', 'is_active'],
};

function initializeFields() {
  const tableSelect = document.getElementById('tableSelect');
  updateFields(tableSelect.value);
}

function updateFields(tableName) {
  const container = document.getElementById('fieldsList');
  container.innerHTML = '';

  availableFields[tableName].forEach((field) => {
    const fieldItem = document.createElement('div');
    fieldItem.className = 'field-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `field_${field}`;
    checkbox.value = field;
    checkbox.checked = true;
    checkbox.onchange = updatePreview;

    const label = document.createElement('label');
    label.htmlFor = `field_${field}`;
    label.textContent = field;

    fieldItem.appendChild(checkbox);
    fieldItem.appendChild(label);
    container.appendChild(fieldItem);
  });
  updatePreview();
}

function selectAllFields(selected) {
  document
    .querySelectorAll('.field-item input[type="checkbox"]')
    .forEach((checkbox) => (checkbox.checked = selected));
  updatePreview();
}

function updatePreview() {
  const selectedFields = Array.from(
    document.querySelectorAll('.field-item input[type="checkbox"]:checked')
  ).map((checkbox) => checkbox.value);

  const tableName = document.getElementById('tableSelect').value;
  const whereClause = document.getElementById('sqlCondition').value.trim();

  const query = `SELECT ${selectedFields.join(', ')}
  FROM ${tableName}
  ${whereClause ? 'WHERE ' + whereClause : ''}`;

  document.getElementById('queryPreview').textContent = query;
}

function parseWhereCondition(whereClause) {
  if (!whereClause.trim()) {
    return null;
  }

  function tokenize(str) {
    // Add spaces around parentheses and operators
    const prepared = str
      .replace(/\(/g, ' ( ')
      .replace(/\)/g, ' ) ')
      .replace(/\s+/g, ' ')
      .trim();

    // Split into tokens but preserve quoted strings
    const tokens = [];
    let current = '';
    let inQuote = false;

    for (let char of prepared) {
      if (char === "'" && !inQuote) {
        inQuote = true;
        current += char;
      } else if (char === "'" && inQuote) {
        inQuote = false;
        current += char;
        tokens.push(current);
        current = '';
      } else if (inQuote) {
        current += char;
      } else if (char === ' ' && current) {
        tokens.push(current);
        current = '';
      } else if (char !== ' ') {
        current += char;
      }
    }
    if (current) tokens.push(current);

    return tokens;
  }

  function parseTokens(tokens, start = 0, end = tokens.length) {
    const result = {
      operator: 'AND',
      conditions: [],
    };

    let i = start;
    while (i < end) {
      if (tokens[i] === '(') {
        // Find matching closing parenthesis
        let depth = 1;
        let j = i + 1;
        while (j < end && depth > 0) {
          if (tokens[j] === '(') depth++;
          if (tokens[j] === ')') depth--;
          j++;
        }

        // Parse nested condition
        const nestedCondition = parseTokens(tokens, i + 1, j - 1);
        nestedCondition.isNested = true;
        result.conditions.push(nestedCondition);
        i = j;
      } else if (
        tokens[i].toUpperCase() === 'AND' ||
        tokens[i].toUpperCase() === 'OR'
      ) {
        // Update operator for the group
        result.operator = tokens[i].toUpperCase();
        i++;
      } else {
        // Parse simple condition
        let condition = {};

        // Handle basic conditions
        condition.column = tokens[i];
        i++;

        if (i < end) {
          condition.operator = tokens[i];
          i++;
        }

        if (i < end) {
          let value = tokens[i];
          // Remove quotes if present
          if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
          }
          condition.value = value;
          i++;
        }

        result.conditions.push(condition);
      }
    }

    // If there's only one condition in a nested group, remove unnecessary nesting
    if (result.conditions.length === 1 && !result.isNested) {
      return result.conditions[0];
    }

    return result;
  }

  const tokens = tokenize(whereClause);
  return parseTokens(tokens);
}

async function validateQuery() {
  const tableName = document.getElementById('tableSelect').value;
  const selectedFields = Array.from(
    document.querySelectorAll('.field-item input[type="checkbox"]:checked')
  ).map((checkbox) => checkbox.value);
  const whereClause = document.getElementById('sqlCondition').value.trim();

  const payload = {
    tableName,
    fields: selectedFields,
    conditions: parseWhereCondition(whereClause),
  };

  try {
    const response = await fetch('/api/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    const resultDiv = document.getElementById('result');

    if (result.isValid) {
      resultDiv.className = 'valid';
      resultDiv.textContent = `Valid SQL Query! ✅\n${result.query}`;
      // Optionally show the parsed structure
      console.log('Parsed Structure:', payload);
    } else {
      resultDiv.className = 'invalid';
      resultDiv.textContent = `Invalid SQL Query: ${result.error} ❌`;
    }
  } catch (error) {
    document.getElementById('result').className = 'invalid';
    document.getElementById('result').textContent =
      'Error validating query. Please try again.';
  }
}

// Initialize fields on load
document.getElementById('tableSelect').addEventListener('change', (e) => {
  updateFields(e.target.value);
});

initializeFields();
