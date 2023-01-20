```
npm install
node main.js

```

sqlite notepad of stuff to modify the original csv

```
SELECT
	substr(address, 1, instr(address, ' ') - 1) AS number,
	substr(address, instr(address, ' ') + 1) AS street
FROM
	"addresses";


UPDATE "addresses"
SET street = substr(address, instr(address, ' ') + 1);

```