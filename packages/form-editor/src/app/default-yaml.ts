export const defaultForm = `
type: form
id: sample-form
name: Sample Form
children:
  - type: page
    id: page1
    name: Page 1
    children:
      - type: text
        id: first_name
        label: First Name*
      - type: text
        id: last_name
        label: Last Name*
      - id: country
        type: select
        label: Country*
        options:
          - value: "us"
            label: "United States"
          - value: "ca"
            label: "Canada"
          - value: "gb"
            label: "United Kingdom"
`.trim();

export const newForm = (name: string) => `
type: form
id: ${name}
name: ${name}
children:
  - type: page
    id: page1
    name: Page 1
    children:
      - type: text
        id: name
        label: Name
`;
