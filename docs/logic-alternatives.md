# Dynamic Logic Enhancement Alternatives for Form Engine

This document outlines various approaches for incorporating more advanced dynamic logic into the form engine beyond the current basic `when`/`then` rules system.

## Current State

The form engine currently supports basic conditional logic through the `useFormRules` hook with a simple structure:

```yaml
rules:
  - when:
      field: fieldName
      is: value
    then:
      - set:
          property: newValue
```

This works well for simple field-based conditions but lacks the flexibility for complex business logic, calculations, or multi-field validations.

## Alternative Approaches

### 1. External JavaScript Function References

**Concept:** Allow YAML schemas to reference external JavaScript files and specific functions.

```yaml
- id: complexField
  type: text
  label: Dynamic Field
  rules:
    - when:
        customLogic:
          file: "./logic/formValidation.js"
          function: "validateComplexCondition"
          params: ["firstName", "age", "income"]
      then:
        - set:
            required: true
            label: "Income verification required"
```

**Implementation Requirements:**
- Dynamic import system for JavaScript modules
- Function parameter mapping from form data
- Error handling for missing files/functions
- Security sandboxing considerations

**Pros:**
- Clean separation of logic from schema
- Reusable functions across multiple forms
- Full JavaScript power and flexibility
- Easy to version control logic separately

**Cons:**
- Security concerns with arbitrary code execution
- Deployment complexity (ensuring JS files are available)
- Harder to debug rule execution
- Potential performance impact from dynamic imports

### 2. Inline JavaScript Expressions

**Concept:** Embed JavaScript expressions directly in the YAML schema.

```yaml
- id: calculatedField
  type: text
  rules:
    - when:
        expression: "data.age >= 18 && data.income > 50000 && context.programType === 'housing'"
      then:
        - set:
            hidden: false
        - calculate:
            field: eligibilityScore
            expression: "(data.age * 0.1) + (data.income / 1000)"
```

**Implementation Requirements:**
- Safe JavaScript evaluation (avoiding `eval()`)
- Expression parser/compiler
- Context injection for `data` and `context` objects
- Error handling for malformed expressions

**Pros:**
- Highly flexible and expressive
- Logic contained within schema
- Easy to write for developers familiar with JavaScript
- No external dependencies

**Cons:**
- **Major security risk** - potential for code injection
- Harder to test and validate
- Performance concerns with expression evaluation
- Debugging difficulties
- Schema becomes less declarative

### 3. Extended Expression Language

**Concept:** Create a domain-specific language for form logic that's more powerful than current rules but safer than JavaScript.

```yaml
- id: conditionalField
  type: text
  rules:
    - when:
        all:
          - field: age
            operator: gte
            value: 18
          - field: income
            operator: between
            value: [30000, 100000]
          - function: dateWithinRange
            params: [birthDate, "2000-01-01", "2005-12-31"]
          - calculate:
              formula: "field(householdSize) * constant(areaMedianIncome) * 0.8"
              operator: lt
              field: income
      then:
        - set:
            required: true
        - calculate:
            field: eligibilityScore
            formula: "(field(age) * 0.1) + (field(income) / 1000)"
```

**Implementation Requirements:**
- Expression language parser and evaluator
- Built-in function library (math, date, string operations)
- Type system for expressions
- Extensible function registry

**Pros:**
- Declarative and schema-friendly
- Secure by design (no arbitrary code execution)
- Extensible through function libraries
- Better tooling potential (syntax highlighting, validation)
- Easier to analyze and optimize

**Cons:**
- Limited compared to full programming languages
- Requires building and maintaining expression evaluator
- Learning curve for developers
- May not cover all edge cases

### 4. Plugin Architecture with Registered Functions

**Concept:** Allow applications to register named functions that can be called from schema rules.

```yaml
- id: smartField
  type: text
  rules:
    - when:
        plugin: "housingEligibility"
        function: "checkIncomeRequirements"
        inputs: ["income", "householdSize", "location"]
      then:
        - set:
            required: true
        - plugin: "housingEligibility"
          function: "calculateEligibilityScore"
          inputs: ["age", "income", "householdSize"]
          output: "eligibilityScore"
```

```javascript
// Application startup code
FormEngine.registerPlugin('housingEligibility', {
  checkIncomeRequirements: (income, householdSize, location) => {
    const amiLimit = getAreaMedianIncome(location) * householdSize * 0.8;
    return income < amiLimit;
  },
  
  calculateEligibilityScore: (age, income, householdSize) => {
    return (age * 0.1) + (income / 1000) - (householdSize * 5);
  }
});
```

**Implementation Requirements:**
- Plugin registration system
- Function parameter mapping and validation
- Return value handling
- Plugin lifecycle management
- TypeScript support for plugin definitions

**Pros:**
- Secure (no arbitrary code execution at runtime)
- Functions are testable and reusable
- Clear separation between schema and logic
- Type-safe with TypeScript
- Performance-efficient (functions pre-registered)
- Extensible without schema format changes

**Cons:**
- Requires plugin system architecture
- More initial setup for applications
- Functions must be registered before form rendering
- May require restart for logic changes in development

### 5. Rule Templates/Macros

**Concept:** Define reusable rule templates that can be instantiated with parameters.

```yaml
# Global rule templates
ruleTemplates:
  incomeValidation:
    when:
      all:
        - field: "{incomeField}"
          operator: gt
          value: 0
        - field: "householdSize"
          operator: gt
          value: 0
        - calculate: "areaMedianIncome * field(householdSize) * 0.8"
          operator: gt
          field: "{incomeField}"
    then:
      - set:
          required: true
          label: "{fieldLabel} is required for income verification"

  ageEligibility:
    when:
      field: "{ageField}"
      operator: between
      value: ["{minAge}", "{maxAge}"]
    then:
      - set:
          hidden: false

# Usage in form components
- id: income
  type: text
  label: Annual Income
  rules:
    - template: incomeValidation
      params:
        incomeField: "income"
        fieldLabel: "Annual Income"

- id: applicantAge
  type: number
  label: Age
  rules:
    - template: ageEligibility
      params:
        ageField: "applicantAge"
        minAge: 18
        maxAge: 65
```

**Implementation Requirements:**
- Template definition system
- Parameter substitution engine
- Template validation and type checking
- Template composition and nesting support

**Pros:**
- Highly reusable patterns
- Maintains declarative schema approach
- Reduces duplication in complex forms
- Can be shared across applications
- Schema-native solution

**Cons:**
- Limited to parameterized variations
- Complex template system needed
- May become difficult to debug
- Parameter explosion for complex cases

## Recommended Approach: Plugin Architecture (#4)

After evaluating all alternatives, I recommend **Plugin Architecture with Registered Functions** for the following reasons:

### Security
- No `eval()` or dynamic code execution
- All logic is pre-registered and validated
- Clear boundaries between schema and executable code

### Maintainability
- Logic exists as standard JavaScript/TypeScript functions
- Fully testable with existing testing frameworks
- Clear separation of concerns
- Easy to refactor and version

### Performance
- Functions registered once at startup
- No runtime compilation or interpretation
- Efficient parameter passing
- Cacheable results

### Developer Experience
- Familiar JavaScript function syntax
- Full TypeScript support and intellisense
- Clear error messages and stack traces
- Easy debugging with standard tools

### Extensibility
- Easy to add new plugins without schema changes
- Can compose complex logic from simple functions
- Backward compatible with existing rule system
- Plugin sharing between applications

## Implementation Strategy

The plugin architecture can be implemented incrementally:

1. **Phase 1:** Extend `useFormRules` to support plugin conditions alongside existing field conditions
2. **Phase 2:** Add plugin registration system to FormEngine
3. **Phase 3:** Implement parameter mapping and return value handling
4. **Phase 4:** Add TypeScript definitions for plugin development
5. **Phase 5:** Create standard plugin library for common use cases

This approach maintains backward compatibility while providing a clear path for applications needing complex dynamic logic.

## Example Integration

```typescript
// Plugin definition
interface HousingPlugin {
  checkIncomeEligibility(income: number, householdSize: number, location: string): boolean;
  calculateAffordability(income: number, rent: number): number;
}

// Registration
FormEngine.registerPlugin<HousingPlugin>('housing', housingPluginImpl);

// Schema usage
rules:
  - when:
      plugin: "housing"
      function: "checkIncomeEligibility"
      inputs: ["income", "householdSize", "location"]
    then:
      - set:
          hidden: false
```

This approach provides the flexibility needed for complex forms while maintaining the security, performance, and maintainability requirements of a production system.