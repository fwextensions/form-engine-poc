export const defaultForm = `
id: sampleForm
title: Sample Multi-Step Form
type: form
display: multipage
children:
  - id: pagePersonalInfo
    type: page
    title: Personal Information
    children:
      - type: html
        tag: div
        className: mb-4 p-4 bg-gray-100 rounded-md shadow
        content: |
          <h3>Hello from Static HTML!</h3>
          <p>This content supports all the <strong>usual</strong> <abbr title="HyperText Markup Language, y'all!">HTML</abbr> tags.</p>

      - id: firstName
        type: text
        label: First Name*

      - id: lastName
        type: text
        label: Last Name*

      - id: birthDate
        type: date
        label: Date of Birth

      - id: email
        type: email
        label: Email Address*
        placeholder: user@example.com

  - id: pageAddressInfo
    type: page
    title: Address Information
    children:
      - id: streetAddress
        type: text
        label: Street Address*
        disabled: true

      - id: city
        type: text
        label: City*

      - id: state
        type: text
        label: State*

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

  - id: pagePreferences
    type: page
    title: Preferences
    children:
      - id: newsletterSubscription
        type: checkbox
        label: Subscribe to newsletter (← click to see more fields)

      - id: subscriptionReason
        type: text
        label: "What topics are you interested in?"
        description: "This field appears when you subscribe."
        hidden: true
        rules:
          - when:
              field: newsletterSubscription
              is: true
            then:
              - set:
                  hidden: false

      - id: contactMethod
        type: radiogroup
        label: Preferred Contact Method*
        options:
          - value: "email"
            label: "Email"
          - value: "phone"
            label: "Phone"

      - id: comments
        type: textarea
        label: Comments
        placeholder: Enter any comments...
        rows: 4
`.trim();

export const newForm = (name: string) => `
type: form
id: ${name}
name: ${name}
children:
  - type: page
    id: page1
    title: Page 1
    children:
      - type: text
        id: name
        label: Name
`.trim();
