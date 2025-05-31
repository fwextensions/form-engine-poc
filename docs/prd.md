# Form Engine Requirements

## Overview

We are creating a reusable, schema-driven form engine to 1\) replace the existing AngularJS-based application “short form” and 2\) support the efficient creation of new forms on DAHLIA.  The goal is to empower non-developer stakeholders to help define forms over time with minimal engineering involvement, while maintaining data integrity, versioning, and dynamic behavior tied to listing-specific logic.  In other words, keep small changes small, so that tweaks to forms for new listings can be accommodated quickly and efficiently.  

## Objectives

* The form engine system should support:  
  * Defining forms through structured, human-readable schemas such as YAML  
  * Translations for multiple languages  
  * Multi-step forms   
  * Conditional logic and calculated fields.  
  * Some sort of component reuse or “modules”  
* The system should be built assuming that forms will change over time.  
* The system should include a tool for previewing and validating form schemas in real time to support staff in creating forms.

## Scope

### In Scope

* Support for schemas (using something like YAML) to define a form using:  
  * Standard form fields (text, date, radio, checkbox, select)  
  * File upload fields  
  * Address validation fields  
  * Multi-step navigation with progress indication  
  * Field-level validation (e.g., required fields, regex validation, conditional validation)  
  * Conditional logic that depends on other field values or listing metadata  
  * Calculated fields, such as age from date of birth or income ratios  
* Localization for at least four languages  
* Reusable field groups or modules that can be updated centrally and versioned  
* Output normalization to a consistent JSON format for downstream use  
* A barebones internal tool with real-time form preview and validation while editing the schema

### Out of Scope

* How form data is transmitted to Salesforce  
* How form submissions are handled in the UI (save for later, etc.)  
* Displaying the data from a submitted form, such as in account pages  
* A full drag-and-drop UI form builder  
* Fully custom visual styling per form

### Target users

* Initially, just the DDS housing team   
* Eventually, we may want to enable MOHCD staff to edit schemas

## Functional Requirements

### Schema Definition

* YAML, or something similar, will be used to define form structure and behavior.  
* The system will include tools to preview the form as defined in the schema.  
* Form schemas can include reusable modules via an inclusion mechanism.  
* Modules can simply be another self-contained YAML file that’s intended for reuse, or could be implemented in code.  
* Modules may be versioned and locked to a specific version per form.

### Rendering Engine

* The engine should render all standard field types and support wizard-style navigation.  
* Labels and help text must support translation.  
* Fields may be shown or hidden based on:  
  * Responses to earlier questions in the form  
  * Listing-specific metadata (e.g., unit type, building rules)  
* The system must support expression-based calculated fields.  
  * Example: `form.monthlyIncome * 12 > listing.minimumAnnualSalary`  
* The engine must render forms accessibly, adhering to WCAG 2.1 AA guidelines.

### Data Handling

* Form submissions will be transformed into a normalized JSON format.  
* This output will then be routed to Salesforce or other external systems based on configuration.  
* Submitting a form may trigger configured workflows, such as confirmation emails or Salesforce processes.

### Form Module Management

* Common field groups (e.g., address blocks) can be defined as reusable modules.  
* Modules can be updated in one place and reused across many forms.  
* A form may specify whether it uses the latest or a pinned version of a module.

### Versioning

* Each form may specify a version of its schema.

## UI Component Architecture

### Headless UI Library Selection

To render forms in a flexible and accessible way, the suggestion is to use a headless UI component library. This allows us to separate logic from presentation while relying on pre-tested accessibility and behavior.

#### Possible Libraries

* **Radix UI**: Provides accessible, unstyled components with full control over appearance.  
* **React Aria**: Offers hooks and primitives for full accessibility control.  
* **Headless UI**: Compatible with Tailwind CSS and focuses on core interactions.  
* **Reach UI**: Focused on accessibility, with minimal API surface.  
* **Shadcn UI**: Combines Radix primitives with opinionated Tailwind styling.

#### Rationale for Using a Library

* These libraries are built with accessibility in mind and are compliant with WAI-ARIA guidelines.  
* Using pre-built components reduces the time spent on low-level UI concerns and allows us to focus on the high-level form flows and behaviors that have the most impact on users.  
* Libraries provide consistent behavior and styling mechanisms, which simplifies testing and maintenance.  
* Adopting a well-supported library ensures long-term maintainability and access to community support.

#### Library Selection Criteria

* Accessibility support  
* Styling flexibility to match DAHLIA design system  
* API consistency and DX

## Configuration & Maintenance

* YAML files should be editable via a simple internal admin UI with a real-time preview.  
* Modules should be stored in a shared registry or repo with visibility into where they are used.  
* Form schemas can reference listing metadata as part of their conditional logic.

## Success Metrics 

???

## Open Questions

* What is the process for publishing a new form version to production?  
* Do modules need their own lifecycle (e.g., approvals, locking before publishing)?  
* Where should the schemas be stored?  GitHub?  Salesforce?
