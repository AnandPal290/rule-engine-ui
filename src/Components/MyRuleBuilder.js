import React, { Component } from 'react';
import { Plus, Minus, ChevronDown } from 'lucide-react';

// Sample configuration that would come from your JSON file
const CONFIG = {
  variables: [
    'debitTran',
    'transactionAmount',
    'rsaDisplayAmount',
    'accountBalance',
    'userType',
    'timeOfDay'
  ],
  operators: [
    { value: 'equals', label: 'Equals To' },
    { value: 'notEquals', label: 'Not Equals To' },
    { value: 'greaterThan', label: 'Greater Than' },
    { value: 'lessThan', label: 'Less Than' },
    { value: 'contains', label: 'Contains' },
    { value: 'startsWith', label: 'Starts With' }
  ],
  logicalOperators: ['And', 'Or'],
  actions: [
    { value: 'setDecision', label: 'Set Decision', fields: ['decision', 'ruleName'] },
    { value: 'log', label: 'Log', fields: ['id', 'ruleName', 'message'] },
    { value: 'terminate', label: 'Terminate', fields: [] },
    { value: 'notify', label: 'Notify', fields: ['recipient', 'message'] }
  ]
};

class RuleBuilder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rules: {
        id: 1,
        type: 'group',
        operator: 'And',
        conditions: [
          {
            id: 2,
            type: 'condition',
            variable: 'debitTran',
            operator: 'equals',
            value: ''
          }
        ],
        actions: []
      },
      nextId: 3
    };
  }

  generateId = () => {
    const id = this.state.nextId;
    this.setState({ nextId: id + 1 });
    return id;
  };

  addCondition = (parentId) => {
    const newCondition = {
      id: this.generateId(),
      type: 'condition',
      variable: CONFIG.variables[0],
      operator: CONFIG.operators[0].value,
      value: ''
    };

    this.setState(prevState => ({
      rules: this.updateRuleById(prevState.rules, parentId, (rule) => ({
        ...rule,
        conditions: [...rule.conditions, newCondition]
      }))
    }));
  };

  addGroup = (parentId) => {
    const newGroup = {
      id: this.generateId(),
      type: 'group',
      operator: 'And',
      conditions: [{
        id: this.generateId(),
        type: 'condition',
        variable: CONFIG.variables[0],
        operator: CONFIG.operators[0].value,
        value: ''
      }],
      actions: []
    };

    this.setState(prevState => ({
      rules: this.updateRuleById(prevState.rules, parentId, (rule) => ({
        ...rule,
        conditions: [...rule.conditions, newGroup]
      }))
    }));
  };

  addAction = (parentId) => {
    const newAction = {
      id: this.generateId(),
      type: CONFIG.actions[0].value,
      fields: {}
    };

    // Initialize fields based on action type
    CONFIG.actions[0].fields.forEach(field => {
      newAction.fields[field] = '';
    });

    this.setState(prevState => ({
      rules: this.updateRuleById(prevState.rules, parentId, (rule) => ({
        ...rule,
        actions: [...rule.actions, newAction]
      }))
    }));
  };

  removeItem = (parentId, itemId) => {
    this.setState(prevState => ({
      rules: this.updateRuleById(prevState.rules, parentId, (rule) => ({
        ...rule,
        conditions: rule.conditions.filter(c => c.id !== itemId),
        actions: rule.actions ? rule.actions.filter(a => a.id !== itemId) : []
      }))
    }));
  };

  updateRuleById = (rules, id, updateFn) => {
    if (rules.id === id) {
      return updateFn(rules);
    }

    if (rules.conditions) {
      return {
        ...rules,
        conditions: rules.conditions.map(condition => this.updateRuleById(condition, id, updateFn))
      };
    }

    return rules;
  };

  updateCondition = (id, field, value) => {
    this.setState(prevState => ({
      rules: this.updateRuleById(prevState.rules, id, (rule) => ({
        ...rule,
        [field]: value
      }))
    }));
  };

  updateAction = (id, field, value) => {
    this.setState(prevState => ({
      rules: this.updateRuleById(prevState.rules, id, (rule) => {
        if (field === 'type') {
          // Reset fields when action type changes
          const actionConfig = CONFIG.actions.find(a => a.value === value);
          const newFields = {};
          actionConfig.fields.forEach(f => {
            newFields[f] = '';
          });
          return { ...rule, type: value, fields: newFields };
        } else {
          return {
            ...rule,
            fields: { ...rule.fields, [field]: value }
          };
        }
      })
    }));
  };

  renderCondition = (condition, parentId, depth = 0) => {
    const marginLeft = depth * 20;

    return (
      <div key={condition.id} className="mb-2" style={{ marginLeft: `${marginLeft}px` }}>
        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border">
          {/* Variable Dropdown */}
          <select
            value={condition.variable}
            onChange={(e) => this.updateCondition(condition.id, 'variable', e.target.value)}
            className="px-2 py-1 border rounded bg-blue-100 text-sm"
          >
            {CONFIG.variables.map(variable => (
              <option key={variable} value={variable}>{variable}</option>
            ))}
          </select>

          {/* Operator Dropdown */}
          <select
            value={condition.operator}
            onChange={(e) => this.updateCondition(condition.id, 'operator', e.target.value)}
            className="px-2 py-1 border rounded bg-blue-100 text-sm"
          >
            {CONFIG.operators.map(op => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>

          {/* Value Input */}
          <input
            type="text"
            value={condition.value}
            onChange={(e) => this.updateCondition(condition.id, 'value', e.target.value)}
            className="px-2 py-1 border rounded text-sm"
            placeholder="Value"
          />

          {/* Remove Button */}
          <button
            onClick={() => this.removeItem(parentId, condition.id)}
            className="p-1 text-red-500 hover:bg-red-100 rounded"
          >
            <Minus size={16} />
          </button>
        </div>
      </div>
    );
  };

  renderGroup = (group, parentId = null, depth = 0) => {
    const marginLeft = depth * 20;

    return (
      <div key={group.id} className="mb-4" style={{ marginLeft: `${marginLeft}px` }}>
        <div className="border rounded-lg p-4 bg-gray-50">
          {/* Group Header */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium">IF</span>
            {parentId && (
              <button
                onClick={() => this.removeItem(parentId, group.id)}
                className="p-1 text-red-500 hover:bg-red-100 rounded ml-auto"
              >
                <Minus size={16} />
              </button>
            )}
          </div>

          {/* Conditions */}
          <div className="space-y-2">
            {group.conditions.map((condition, index) => (
              <div key={condition.id}>
                {index > 0 && (
                  <div className="flex items-center gap-2 my-2" style={{ marginLeft: `${depth * 20}px` }}>
                    <select
                      value={group.operator}
                      onChange={(e) => this.updateCondition(group.id, 'operator', e.target.value)}
                      className="px-2 py-1 border rounded bg-blue-100 text-sm"
                    >
                      {CONFIG.logicalOperators.map(op => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                  </div>
                )}

                {condition.type === 'condition'
                  ? this.renderCondition(condition, group.id, depth)
                  : this.renderGroup(condition, group.id, depth + 1)
                }
              </div>
            ))}
          </div>

          {/* Add Condition/Group Buttons */}
          <div className="flex gap-2 mt-3" style={{ marginLeft: `${depth * 20}px` }}>
            <button
              onClick={() => this.addCondition(group.id)}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              <Plus size={14} />
              Add Condition
            </button>
            <button
              onClick={() => this.addGroup(group.id)}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              <Plus size={14} />
              Add Group
            </button>
          </div>

          {/* Actions Section */}
          {group.actions && group.actions.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Actions:</h4>
              {group.actions.map(action => this.renderAction(action, group.id, depth))}
            </div>
          )}

          {/* Add Action Button */}
          <div className="mt-4">
            <button
              onClick={() => this.addAction(group.id)}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Plus size={14} />
              Add Action
            </button>
          </div>
        </div>
      </div>
    );
  };

  renderAction = (action, parentId, depth = 0) => {
    const marginLeft = depth * 20;
    const actionConfig = CONFIG.actions.find(a => a.value === action.type);

    return (
      <div key={action.id} className="mb-2" style={{ marginLeft: `${marginLeft}px` }}>
        <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded border">
          {/* Action Type Dropdown */}
          <select
            value={action.type}
            onChange={(e) => this.updateAction(action.id, 'type', e.target.value)}
            className="px-2 py-1 border rounded bg-yellow-100 text-sm"
          >
            {CONFIG.actions.map(actionType => (
              <option key={actionType.value} value={actionType.value}>
                {actionType.label}
              </option>
            ))}
          </select>

          {/* Dynamic Fields */}
          {actionConfig && actionConfig.fields.map(field => (
            <input
              key={field}
              type="text"
              placeholder={field}
              value={action.fields[field] || ''}
              onChange={(e) => this.updateAction(action.id, field, e.target.value)}
              className="px-2 py-1 border rounded text-sm"
            />
          ))}

          {/* Remove Button */}
          <button
            onClick={() => this.removeItem(parentId, action.id)}
            className="p-1 text-red-500 hover:bg-red-100 rounded"
          >
            <Minus size={16} />
          </button>
        </div>
      </div>
    );
  };

  exportRules = () => {
    console.log('Current Rules:', JSON.stringify(this.state.rules, null, 2));
    alert('Rules exported to console. Check developer tools.');
  };

  render() {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-white">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Rule Builder</h1>
          <button
            onClick={this.exportRules}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Export Rules
          </button>
        </div>

        <div className="border rounded-lg p-4">
          {this.renderGroup(this.state.rules)}
        </div>

        {/* Preview Section */}
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="text-lg font-semibold mb-2">JSON Preview:</h3>
          <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
            {JSON.stringify(this.state.rules, null, 2)}
          </pre>
        </div>
      </div>
    );
  }
}

export default RuleBuilder;