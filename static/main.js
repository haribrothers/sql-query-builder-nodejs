const columns = ['InqID', 'user', 'flagcds', 'winloss', 'statuscd'];

const sqlOperators = {
  comparison: [
    { value: '=', label: '=' },
    { value: '<>', label: '≠' },
    { value: '>', label: '>' },
    { value: '<', label: '<' },
    { value: '>=', label: '≥' },
    { value: '<=', label: '≤' },
  ],
  logical: [
    { value: 'AND', label: 'AND' },
    { value: 'OR', label: 'OR' },
    { value: 'NOT', label: 'NOT' },
  ],
  set: [
    { value: 'IN', label: 'IN' },
    { value: 'NOT IN', label: 'NOT IN' },
    { value: 'EXISTS', label: 'EXISTS' },
    { value: 'NOT EXISTS', label: 'NOT EXISTS' },
  ],
  pattern: [
    { value: 'LIKE', label: 'LIKE' },
    { value: 'NOT LIKE', label: 'NOT LIKE' },
  ],
  range: [
    { value: 'BETWEEN', label: 'BETWEEN' },
    { value: 'NOT BETWEEN', label: 'NOT BETWEEN' },
  ],
  quantifier: [
    { value: 'ALL', label: 'ALL' },
    { value: 'ANY', label: 'ANY' },
    { value: 'SOME', label: 'SOME' },
  ],
};

function updatePreview() {
  const selectedFields = Array.from(
    document.querySelectorAll('.field-item input[type="checkbox"]:checked')
  ).map((checkbox) => checkbox.value);
  const tableSelect = document.getElementById('tableSelect');
  const whereSql = mainGroup.toSQL();
  const whereClause = whereSql === '' ? '' : `\nWHERE ${whereSql}`;
  const sql = `SELECT ${selectedFields.join(', ')} \nFROM ${
    tableSelect.value
  } ${whereClause}`;
  document.getElementById('preview').textContent = sql;
}

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

const tableNames = [
  { label: 'Inquiry', value: 'inquiry' },
  { label: 'Users', value: 'users' },
  { label: 'Status', value: 'status' },
];

function initializeTableSelector() {
  const tableField = document.getElementById('tableField');
  const tableSelect = document.createElement('select');
  tableNames.forEach((op) => {
    const option = document.createElement('option');
    option.value = op.value;
    option.textContent = op.label;
    tableSelect.appendChild(option);
  });
  tableSelect.id = 'tableSelect';
  tableSelect.style.width = '100%';
  tableSelect.onchange = () => {
    initializeFieldsSelector();
    updatePreview();
  };

  tableField.appendChild(tableSelect);
}

function initializeFieldsSelector() {
  const tableSelect = document.getElementById('tableSelect');
  const fieldsList = document.getElementById('fieldsList');
  fieldsList.innerHTML = '';
  availableFields[tableSelect.value].forEach((field) => {
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
    fieldsList.appendChild(fieldItem);
  });
}

function selectAllFields(selected) {
  document
    .querySelectorAll('.field-item input[type="checkbox"]')
    .forEach((checkbox) => (checkbox.checked = selected));
  updatePreview();
}

class ConditionGroup {
  constructor(parent = null, isNested = false) {
    this.element = document.createElement('div');
    this.element.className = `condition-group ${
      isNested ? 'nested-group' : ''
    }`;
    this.conditions = [];
    this.parent = parent;
    this.isNested = isNested;
    this.logicalOperator = 'AND';
    this.init();
  }

  init() {
    const header = document.createElement('div');
    header.className = 'group-header';

    const logicalToggle = document.createElement('div');
    logicalToggle.className = 'segment-control';

    const andInput = document.createElement('input');
    andInput.type = 'radio';
    andInput.id = `and_${Math.random().toString(36).substring(2, 9)}`; // Unique ID
    andInput.name = `operator_${andInput.id}`;
    andInput.value = 'AND';
    andInput.checked = this.logicalOperator === 'AND';
    const andLabel = document.createElement('label');
    andLabel.htmlFor = andInput.id;
    andLabel.textContent = 'AND';
    const orInput = document.createElement('input');
    orInput.type = 'radio';
    orInput.id = `or_${Math.random().toString(36).substr(2, 9)}`; // Unique ID
    orInput.name = `operator_${andInput.id}`;
    orInput.value = 'OR';
    orInput.checked = this.logicalOperator === 'OR';
    
    const orLabel = document.createElement('label');
    orLabel.htmlFor = orInput.id;
    orLabel.textContent = 'OR';

    logicalToggle.onchange = (e) => {
      this.logicalOperator = e.target.value;
      updatePreview();
    }

    logicalToggle.appendChild(andInput);
    logicalToggle.appendChild(andLabel);
    logicalToggle.appendChild(orInput);
    logicalToggle.appendChild(orLabel);
    
    // const logicalToggle = document.createElement('label');
    // logicalToggle.className = 'toggle-switch';
    // const toggleInput = document.createElement('input');
    // toggleInput.type = 'checkbox';
    // toggleInput.checked = this.logicalOperator === 'OR';
    // toggleInput.onchange = (e) => {
    //   this.logicalOperator = e.target.checked ? 'OR' : 'AND';
    //   updatePreview();
    // }
    // const sliderSpan = document.createElement('span');
    // sliderSpan.className = 'slider';

    // logicalToggle.appendChild(toggleInput);
    // logicalToggle.appendChild(sliderSpan);

    // const logicalToggle = document.createElement('div');
    // logicalToggle.className = 'logical-toggle and';
    // logicalToggle.textContent = 'AND';
    // logicalToggle.onclick = () => {
    //   this.logicalOperator = this.logicalOperator === 'AND' ? 'OR' : 'AND';
    //   logicalToggle.className = `logical-toggle ${this.logicalOperator.toLowerCase()}`;
    //   logicalToggle.textContent = this.logicalOperator;
    //   updatePreview();
    // };

    const actions = document.createElement('div');
    actions.className = 'group-actions';

    const addConditionBtn = this.createIconButton('fa-plus', 'add-btn', () =>
      this.addCondition()
    );
    const addGroupBtn = this.createIconButton(
      'fa-folder-plus',
      'group-btn',
      () => this.addNestedGroup()
    );

    actions.appendChild(addConditionBtn);
    actions.appendChild(addGroupBtn);

    if (this.isNested) {
      const removeBtn = this.createIconButton('fa-close', 'remove-btn', () =>
        this.remove()
      );
      actions.appendChild(removeBtn);
    }

    header.appendChild(logicalToggle);
    header.appendChild(actions);
    this.element.appendChild(header);
  }

  createIconButton(iconClass, buttonClass, onClick) {
    const button = document.createElement('button');
    button.className = `icon-button ${buttonClass}`;
    button.innerHTML = `<i class="fas ${iconClass}"></i>`;
    button.onclick = onClick;
    return button;
  }

  addCondition(afterCondition = null) {
    const condition = new Condition(this);
    if (afterCondition) {
      const index = this.conditions.indexOf(afterCondition);
      this.conditions.splice(index + 1, 0, condition);
      afterCondition.element.after(condition.element);
    } else {
      this.conditions.push(condition);
      this.element.appendChild(condition.element);
    }
    updatePreview();
  }

  addNestedGroup() {
    const group = new ConditionGroup(this, true);
    this.conditions.push(group);
    this.element.appendChild(group.element);
    group.addCondition();
    updatePreview();
  }

  remove() {
    if (this.parent) {
      const index = this.parent.conditions.indexOf(this);
      if (index > -1) {
        this.parent.conditions.splice(index, 1);
      }
      this.element.remove();
      updatePreview();
    }
  }

  toSQL() {
    if (this.conditions.length === 0) return '';

    const parts = this.conditions.map((c) => c.toSQL()).filter((sql) => sql);
    if (parts.length === 0) return '';

    let sql = parts.join(` ${this.logicalOperator} `);
    if (this.isNested && parts.length > 1) {
      sql = `(${sql})`;
    }
    return sql;
  }

  toJSON() {
    if (this.conditions.length === 0) return null;

    const conditions = this.conditions
      .map((c) => (c instanceof Condition ? c.toJSON() : c.toJSON()))
      .filter((c) => c != null);

    if (conditions.length === 0) return null;

    return {
      operator: this.logicalOperator,
      conditions: conditions,
      isNested: this.isNested,
    };
  }
}

class Condition {
  constructor(group) {
    this.group = group;
    this.element = document.createElement('div');
    this.element.className = 'form-row';
    this.init();
  }

  init() {
    const columnSelect = document.createElement('select');
    columns.forEach((col) => {
      const option = document.createElement('option');
      option.value = col;
      option.textContent = col;
      columnSelect.appendChild(option);
    });

    const operatorSelect = document.createElement('select');
    operatorSelect.className = 'operator-select';

    Object.entries(sqlOperators).forEach(([group, operators]) => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = group.charAt(0).toUpperCase() + group.slice(1);

      operators.forEach((op) => {
        const option = document.createElement('option');
        option.value = op.value;
        option.textContent = op.label;
        optgroup.appendChild(option);
      });

      operatorSelect.appendChild(optgroup);
    });

    operatorSelect.onchange = () => {
      this.updateValueInput();
      updatePreview();
    };

    const valueContainer = document.createElement('div');
    valueContainer.className = 'value-container';

    this.valueContainer = valueContainer;
    this.controls = { columnSelect, operatorSelect };
    this.updateValueInput();

    // const valueInput = document.createElement('input');
    // valueInput.type = 'text';
    // valueInput.placeholder = 'Value';

    // this.controls = { columnSelect, operatorSelect, valueInput };

    const actionGroup = document.createElement('div');
    actionGroup.className = 'action-group';

    const addConditionBtn = this.createIconButton('fa-plus', 'add-btn', () =>
      this.group.addCondition(this)
    );
    addConditionBtn.title = 'Add Condition';

    const addGroupBtn = this.createIconButton(
      'fa-folder-plus',
      'group-btn',
      () => this.addNestedGroupAfter()
    );
    addGroupBtn.title = 'Add Nested Group';

    const removeBtn = this.createIconButton('fa-close', 'remove-btn', () =>
      this.remove()
    );
    removeBtn.title = 'Remove';

    actionGroup.appendChild(addConditionBtn);
    actionGroup.appendChild(addGroupBtn);
    actionGroup.appendChild(removeBtn);

    operatorSelect.addEventListener('change', () => {
      this.updateValueInput();
      updatePreview();
    });

    [columnSelect, operatorSelect].forEach((control) => {
      control.onchange = () => updatePreview();
      control.onkeyup = () => updatePreview();
    });

    this.element.appendChild(columnSelect);
    this.element.appendChild(operatorSelect);
    this.element.appendChild(valueContainer);
    this.element.appendChild(actionGroup);
  }

  updateValueInput() {
    const operator = this.controls.operatorSelect.value.toUpperCase();
    this.valueContainer.innerHTML = '';

    switch (operator) {
      case 'BETWEEN':
      case 'NOT BETWEEN':
        // Create two inputs for BETWEEN
        const fromInput = document.createElement('input');
        fromInput.type = 'text';
        fromInput.placeholder = 'From';
        fromInput.className = 'value-input';

        const andLabel = document.createElement('span');
        andLabel.textContent = 'AND';
        andLabel.style.alignSelf = 'center';

        const toInput = document.createElement('input');
        toInput.type = 'text';
        toInput.placeholder = 'To';
        toInput.className = 'value-input';

        this.valueContainer.appendChild(fromInput);
        this.valueContainer.appendChild(andLabel);
        this.valueContainer.appendChild(toInput);

        this.controls.valueInputs = [fromInput, toInput];
        break;

      case 'IN':
      case 'NOT IN':
        // Create input for comma-separated values
        const inInput = document.createElement('input');
        inInput.type = 'text';
        inInput.placeholder = 'Values (comma separated)';
        inInput.className = 'value-input';

        this.valueContainer.appendChild(inInput);
        this.controls.valueInputs = [inInput];
        break;

      case 'EXISTS':
      case 'NOT EXISTS':
        // No value input needed for EXISTS
        const placeholder = document.createElement('span');
        placeholder.textContent = '(No value needed)';
        placeholder.style.color = '#666';
        placeholder.style.alignSelf = 'center';

        this.valueContainer.appendChild(placeholder);
        this.controls.valueInputs = [];
        break;

      default:
        // Standard single value input
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Value';
        input.className = 'value-input';

        this.valueContainer.appendChild(input);
        this.controls.valueInputs = [input];
    }

    // Add change listeners
    if (this.controls.valueInputs) {
      this.controls.valueInputs.forEach((input) => {
        input.onchange = () => updatePreview();
        input.onkeyup = () => updatePreview();
      });
    }
  }

  addNestedGroupAfter() {
    const group = new ConditionGroup(this.group, true);
    const index = this.group.conditions.indexOf(this);
    this.group.conditions.splice(index + 1, 0, group);
    this.element.after(group.element);
    group.addCondition();
    updatePreview();
  }

  createIconButton(iconClass, buttonClass, onClick) {
    const button = document.createElement('button');
    button.className = `icon-button ${buttonClass}`;
    button.innerHTML = `<i class="fas ${iconClass}"></i>`;
    button.onclick = onClick;
    return button;
  }

  remove() {
    const index = this.group.conditions.indexOf(this);
    if (index > -1) {
      this.group.conditions.splice(index, 1);
    }
    this.element.remove();
    updatePreview();
  }

  toSQL() {
    const { columnSelect, operatorSelect, valueInputs } = this.controls;
    const operator = operatorSelect.value.toUpperCase();

    // Handle different operator types
    switch (operator) {
      case 'BETWEEN':
      case 'NOT BETWEEN':
        if (!valueInputs[0].value.trim() || !valueInputs[1].value.trim())
          return '';
        const from = this.formatValue(valueInputs[0].value.trim());
        const to = this.formatValue(valueInputs[1].value.trim());
        return `${columnSelect.value} ${operator} ${from} AND ${to}`;

      case 'IN':
      case 'NOT IN':
        if (!valueInputs[0].value.trim()) return '';
        const values = valueInputs[0].value
          .split(',')
          .map((v) => this.formatValue(v.trim()))
          .join(', ');
        return `${columnSelect.value} ${operator} (${values})`;

      case 'EXISTS':
      case 'NOT EXISTS':
        return `${operator} (${columnSelect.value})`;

      default:
        if (!valueInputs[0].value.trim()) return '';
        const value = this.formatValue(valueInputs[0].value.trim());
        return `${columnSelect.value} ${operator} ${value}`;
    }
  }

  toJSON() {
    const { columnSelect, operatorSelect, valueInputs } = this.controls;
    const operator = operatorSelect.value;

    if (!valueInputs || valueInputs.length === 0) {
      return {
        column: columnSelect.value,
        operator: operator,
        value: null,
      };
    }

    const values = valueInputs.map((input) => input.value.trim());
    if (
      values.some((v) => !v) &&
      !['EXISTS', 'NOT EXISTS'].includes(operator)
    ) {
      return null;
    }

    return {
      column: columnSelect.value,
      operator: operator,
      value: values.length === 1 ? values[0] : values,
      formattedValue: this.formatValue(values[0]),
    };
  }

  formatValue(value) {
    if (this.controls.operatorSelect.value === 'LIKE') {
      return `'%${value}%'`;
    }
    return isNaN(value) ? `'${value}'` : value;
  }
}

// Initialize main group
initializeTableSelector();
initializeFieldsSelector();
const mainGroup = new ConditionGroup();
document.getElementById('mainGroup').appendChild(mainGroup.element);
mainGroup.addCondition();

function showAlert(message, type = 'success') {
  // Remove existing alert if any
  const existingAlert = document.querySelector('.alert');
  if (existingAlert) {
    existingAlert.remove();
  }

  // Create alert element
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  
  // Create content
  const content = document.createElement('div');
  content.className = 'alert-content';
  content.textContent = message;
  
  // Create close button
  const closeBtn = document.createElement('div');
  closeBtn.className = 'alert-close';
  closeBtn.innerHTML = '<i class="fas fa-times"></i>';
  
  // Add elements to alert
  alert.appendChild(content);
  alert.appendChild(closeBtn);
  
  // Add to document
  document.body.appendChild(alert);
  
  // Handle close button
  closeBtn.onclick = () => {
    alert.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => alert.remove(), 300);
  };
  
  // Auto dismiss after 5 seconds
  setTimeout(() => {
    if (alert.parentElement) {
      alert.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => alert.remove(), 300);
    }
  }, 5000);
}

async function validateConditions() {
  const tableSelect = document.getElementById('tableSelect');
  const selectedFields = Array.from(
    document.querySelectorAll('.field-item input[type="checkbox"]:checked')
  ).map(checkbox => checkbox.value);

  const payload = {
    tableName: tableSelect.value,
    fields: selectedFields,
    conditions: mainGroup.toJSON()
  };

  try {
    const response = await fetch('/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (result.isValid) {
      showAlert(`Valid SQL Query:\n${result.query}`, 'success');
    } else {
      showAlert(`Invalid SQL: ${result.error}`, 'error');
    }
  } catch (error) {
    showAlert('Error validating query. Please try again.', 'error');
  }
}
