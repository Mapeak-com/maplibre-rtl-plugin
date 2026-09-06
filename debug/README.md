# Manual check

`npm start` builds the plugin and opens this page against a real map. Every label should read
correctly:

| label | what to look for |
| --- | --- |
| `مرحبا بالعالم` | the letters of each word joined up, not standing separately |
| `شارع الملك فهد` | the same, across three words |
| `اَلْعَرَبِيَّة` | joined, with the vowel points sitting on the letters they belong to |
| `שלום עולם` | reads right to left |
| `רחוב הרצל 12` | reads right to left, with `12` still left to right and at the left |
| `hello مرحبا world` | `hello` on the left, `world` on the right, the Arabic joined in between |
