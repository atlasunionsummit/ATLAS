## Safe React Refactoring & Defensive Rendering
When modifying React applications, especially when deleting features or connecting dynamic NoSQL data, follow these strict guidelines:

1. **Defensive Data Mapping:** When mapping or transforming data fetched from an API (especially NoSQL databases like Firestore), NEVER assume fields exist on legacy records. Always wrap string operations (like `.toLowerCase()`) in null checks (`if (!item.name) return`) and provide ternary fallbacks for UI elements to prevent `TypeError: Cannot read properties of undefined` crashes.
2. **Systematic Prop Scrubbing:** When deleting a feature or a top-level function (e.g., a registration handler), you MUST grep the codebase to find all child components that receive it as a prop. Remove the prop from their function signatures and delete any UI elements (like buttons) that rely on it to prevent `undefined is not a function` crashes.
3. **End-to-End State Sync:** When building admin panel CRUD features, you MUST verify that the public-facing frontend components are upgraded from static arrays to dynamic fetches so the admin changes actually appear to end-users.
