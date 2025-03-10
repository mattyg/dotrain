[Home](../index.md) &gt; [inclusiveParse](./inclusiveparse_1.md)

# Function inclusiveParse()

Parses an string by extracting matching strings

<b>Signature:</b>

```typescript
function inclusiveParse(str: string, pattern: RegExp, offset?: number): ParsedChunk[];
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  str | `string` | The string to parse |
|  pattern | `RegExp` | The pattern to search and extract |
|  offset | `number` | (optional) The offset to factor in for returning matched positions |

<b>Returns:</b>

`ParsedChunk[]`

