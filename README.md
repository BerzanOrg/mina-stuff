# 🍊 Mina Stuff

The project is developed using [Node.js v20.20.0](https://nodejs.org/), [npm v10.3.0](https://docs.npmjs.com/) and [o1js v0.15.2](https://github.com/o1-labs/o1js).

```sh
git clone https://github.com/berzanorg/mina-stuff.git
```

## 🚀 Project Structure

Inside of the project, you'll see the following folders and files:

```text
/
├── src/
│   ├── MessageBox.test.ts
│   ├── MessageBox.ts
│   ├── SpyMaster.test.ts
│   └── SpyMaster.ts
└── package.json
```

Any smart contract, zk program and test can be placed in the `src/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                                | Action                 |
| :------------------------------------- | :--------------------- |
| `npm install`                          | Installs dependencies  |
| `npm test -- build/*.test.js`          | Runs all tests         |
| `npm test -- build/MessageBox.test.js` | Runs message box tests |
| `npm test -- build/SpyMaster.test.js`  | Runs spy master tests  |

## 👨🏻‍🔬 Author

The project is developed by [Berzan](https://berzan.org/) with his love, sweat, and tears.
