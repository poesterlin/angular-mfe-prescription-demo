# Programming Task for the Second Interview

<!-- Faithful markdown conversion of Programming_Task_Second_Interview_Angular_EN.pdf
     in this folder. Headings and lists reflect the PDF's structure; wording is
     unchanged. The PDF remains authoritative if the two ever disagree. -->

As part of the second, in-person interview, we would like to discuss a practical frontend
architecture task with you. The task is intended to give us insight into your technical
approach, your architectural thinking, your experience with Angular at scale, and your
ability to clearly explain and justify technical decisions.

> **Note:** The goal is not to deliver a perfect or production-ready solution, but a clean
> and well-reasoned approach.

## 1. Task Description

### Context

Our development organization works with multiple teams contributing to a shared frontend
landscape. One of our current challenges is enabling independent team releases while
keeping a coherent overall architecture and user experience.

We are therefore exploring a micro frontend–based approach for Angular applications.

### Task

Create a minimal Angular-based solution consisting of:

- **A Shell Application:**
  - Acts as the main host application
  - Provides global layout and navigation
  - Integrates independently built frontend modules
- **A Remote Frontend Application ("Prescription"):**
  - Integrated into the shell via routing
  - Provides a single view consisting of:
    - A table view of prescriptions (with columns: medication name, insurant name,
      insurant birth date, insurant id, prescription date)
    - Backend-based searching, filtering, and paging capabilities
    - It is assumed the backend provides an HTTP REST interface for a query, this
      backend service should be mocked.

### Constraints

- Use Angular and TypeScript
- Focus on clean structure, modularity, and separation of concerns
- No authentication or authorization concerns need to be addressed
- UI/UX may be minimal; emphasis is on architecture and reasoning

### Expected outcome

- A runnable shell application and one runnable remote application
- Shell and remote frontend must be independently buildable and runnable
- A clear and understandable project structure
- Readable and well-reasoned code
- A short Readme for the solution with key architectural decisions

## 2. Scope and Guidelines

- Time guideline: approximately 2-4 hours
- Assumptions and simplifications are allowed and encouraged but should be stated
  explicitly.
- Error handling, styling, accessibility, and documentation may be simplified
- Provide your solution as a GitHub repository or a ZIP archive.
- Usage of AI development tools is explicitly allowed and encouraged but needs to be
  explained how it was used.

## 3. Presentation During the Interview

Please present your solution during the interview (approx. 20–30 minutes). Slides are not
required (but allowed); whiteboard or flipchart can be used as well:

- Brief recap of the task and its scope.
- Explanation of your architectural approach and assumptions
- Walkthrough or demo of the running solution
- Explanation of:
  - Responsibilities and boundaries between shell and remote frontend
  - Your testing approach:
    - Which types of tests you would introduce (unit, integration, end-to-end)
    - How the remote frontend could be tested in isolation
    - How integration between shell and remote frontend could be validated
  - Your migration approach:
    - How you would incrementally migrate an existing Angular monolith to this
      architecture
    - Which parts you would extract first and why
    - How you would avoid disrupting ongoing development

## 4. Evaluation Criteria

The solution and its presentation will be evaluated holistically based on the following
aspects:

- **Architectural understanding**
  Clear separation of responsibilities and suitability of the approach for independent
  team releases
- **Pragmatism and scalability**
  Reasonable assumptions and awareness of real-world constraints
- **Frontend engineering maturity**
  Appropriate Angular structuring, routing, and service design
- **Testing and quality awareness**
  A realistic and pragmatic testing strategy
- **Migration and leadership perspective**
  Ability to reason about incremental evolution of an existing system
- **Communication**
  Clear and structured explanation of decisions and trade-offs

## 5. Notes

If you have any questions regarding the task, feel free to contact us in advance.
There is no single correct solution – we are looking forward to a constructive technical
discussion with you.
