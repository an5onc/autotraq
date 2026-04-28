## Vehicle ↔ Parts Network Graph

### Expected data shape
```js
{
  nodes: [
    { id: string, type: "vehicle" | "part" }
  ],
  links: [
    { source: string, target: string }
  ]
}
