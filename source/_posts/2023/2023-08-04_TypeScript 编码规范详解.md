---
title: TypeScript 编码规范详解
date: 2023-08-04 06:24:00
tags:
  - 2023
  - TypeScript
  - 程序设计
  - 编码规范
categories:
  - 前端技术
  - TypeScript
---
> **TypeScript 编码规范** 旨在提供一套指导原则和最佳实践，以确保 TypeScript 代码的**一致性、可读性、可维护性、类型安全性**和**团队协作效率**。TypeScript 作为 JavaScript 的超集，引入了静态类型和更多现代语言特性。因此，其编码规范不仅要遵循 JavaScript 的最佳实践，还要充分利用 TypeScript 独有的类型系统优势。本规范结合了社区广泛接受的实践（如 Google TypeScript Style Guide、Airbnb TypeScript Style Guide）和 TypeScript 官方建议，以帮助开发者编写高质量的 TypeScript 代码。

{% note info %}
核心思想：**充分利用 TypeScript 的类型系统，提高代码的可维护性和健壮性。保持代码简洁、明确，易于理解和调试。遵循一致的风格，减少不必要的复杂性。**
{% endnote %}
------

## 一、TypeScript 编码哲学

理解 TypeScript 的设计哲学对于编写高质量代码至关重要：

1.  **渐进增强 (Gradual Typing)**：TypeScript 允许你在 JavaScript 代码库中逐步引入类型，而不是要求一次性重写所有代码。
2.  **类型安全与运行时行为分离**：TypeScript 的类型检查发生在编译时，不影响运行时的 JavaScript 代码行为。类型信息在编译后会被擦除。
3.  **拥抱 JavaScript 生态**：TypeScript 旨在与现有 JavaScript 工具链和库无缝集成。
4.  **清晰与意图**：类型声明应清晰地表达代码的意图，帮助开发者理解数据结构和函数签名。
5.  **一致性**：统一的编码风格和类型使用习惯，能够极大地提升团队协作效率。

## 二、自动化工具

自动化工具是强制执行 TypeScript 编码规范的基石，能够显著减少手动审查的工作量。

### 2.1 `ESLint` (代码风格和潜在错误检查)

*   **核心工具**：`ESLint` 是 JavaScript 和 TypeScript 最流行的 linting 工具。它可以检查代码风格、潜在的错误、不一致的命名等。
*   **TypeScript 集成**：通过 `@typescript-eslint/parser` 和 `@typescript-eslint/eslint-plugin`，ESLint 可以完全支持 TypeScript 代码。
*   **安装 (示例)**：
    ```bash
    npm install eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin --save-dev
    # 或 yarn add eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin --dev
    ```
*   **配置 (`.eslintrc.js` 示例)**：
    ```javascript
    module.exports = {
      parser: '@typescript-eslint/parser', // Specifies the ESLint parser
      extends: [
        'eslint:recommended', // Use the recommended rules from @eslint/eslint-plugin-recommended
        'plugin:@typescript-eslint/recommended', // Use the recommended rules from @typescript-eslint/eslint-plugin
        'plugin:@typescript-eslint/recommended-requiring-type-checking', // Type-aware linting
        'prettier', // Use eslint-config-prettier to disable ESLint rules that conflict with Prettier
        'plugin:prettier/recommended' // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors.
      ],
      parserOptions: {
        ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
        sourceType: 'module', // Allows for the use of imports
        project: './tsconfig.json', // Required for type-aware linting
      },
      rules: {
        // Place to add your custom ESLint rules
        // e.g. "@typescript-eslint/explicit-function-return-type": "off",
        // "@typescript-eslint/no-explicit-any": "error",
      },
    };
    ```
*   **使用**：`eslint .` 或 `eslint your_file.ts`

### 2.2 `Prettier` (代码格式化工具)

*   **独断专行 (Opinionated)**：`Prettier` 是一款高度独断的格式化工具，它通过解析代码并使用自己的规则重新打印来确保一致的风格。
*   **优点**：解决了团队内部关于代码格式的争论，与 ESLint 配合使用，负责纯格式化（如缩进、行宽、引号）。
*   **安装**：`npm install prettier eslint-config-prettier eslint-plugin-prettier --save-dev`
*   **配置 (`.prettierrc.js` 示例)**：
    ```javascript
    module.exports = {
      semi: true, // 行尾是否添加分号
      trailingComma: 'all', // 多行时，尽可能打印尾随逗号
      singleQuote: true, // 使用单引号
      printWidth: 100, // 每行最大字符数
      tabWidth: 2, // 缩进空格数
      useTabs: false, // 不使用 tab 缩进
    };
    ```
*   **使用**：`prettier --write .`

### 2.3 `ts-node` (开发时直接运行 TypeScript)

*   **无需编译**：`ts-node` 允许你在 Node.js 环境中直接运行 TypeScript 文件，无需提前编译为 JavaScript。在开发和测试时非常方便。
*   **安装**：`npm install -g ts-node typescript`

### 2.4 `TypeScript Compiler (tsc)`

*   **核心工具**：TypeScript 编译器是语言本身的核心，用于将 `.ts` 文件编译为 `.js` 文件。
*   **`tsconfig.json`**：项目的根目录中必须有一个 `tsconfig.json` 文件，它配置了编译器的行为（如目标 JavaScript 版本、模块系统、严格性检查等）。

## 三、格式化 (由 Prettier/ESLint 处理)

以下规则通常由 Prettier 自动处理，而 ESLint 会检查并报告不符合规则的情况。

### 3.1 缩进 (Indentation)

*   **2 个空格**：每个缩进级别使用 2 个空格。**绝不允许使用 Tab 字符**。
*   **理由**：在前端社区和 JavaScript/TypeScript 生态中，2 个空格是最常见的约定。

### 3.2 行长度 (Line Length)

*   **最大 100 或 120 字符**：虽然 PEP 8 建议 79 字符，但在现代宽屏显示器下，100 或 120 字符是 TypeScript/JavaScript 社区更常见的实践。选择一个一致的限制。
*   **换行**：
    *   长语句应在适当的运算符或逗号后换行。
    *   函数的参数列表过长时，每个参数可以单独占一行。

    ```typescript
    // Good (Prettier 会自动处理)
    const longVariableName =
      someFunctionCall(
        paramOne,
        paramTwo,
        paramThree
      );

    // Bad (超出行长度限制)
    const veryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryLongVariableName = 100;
    ```

### 3.3 引号 (Quotes)

*   **单引号**：字符串字面量通常使用单引号 `'`。
*   **模板字面量**：使用反引号 `` ` `` 进行字符串插值或多行字符串。

    ```typescript
    // Good
    const name = 'Alice';
    const message = `Hello, ${name}!`;

    // Bad
    const city = "New York";
    ```

### 3.4 空格 (Whitespace)

*   **运算符两侧**：在二元运算符（`=`, `+`, `-`, `*`, `/`, `===`, `&&` 等）的两侧各放置一个空格。
*   **逗号后**：逗号 `,` 后需要空格。
*   **函数括号**：函数名称与左括号 `(` 之间不应有空格。
*   **代码块花括号**：代码块的 `{` 前需要空格，`}` 后可以根据情况决定。

    ```typescript
    // Good
    const result = a + b;
    const items = [1, 2, 3];
    function doSomething(param: string) { /* ... */ }

    // Bad
    const result=a+b;
    const items = [1,2,3];
    function doSomething (param:string){/* ... */}
    ```

## 四、命名规范 (Naming Conventions)

TypeScript 的命名规范大部分沿袭了 JavaScript，并根据类型系统进行了一些扩展。

### 4.1 变量、函数、方法、模块别名

*   **`camelCase` (小驼峰命名法)**：第一个单词的首字母小写，后续单词的首字母大写。
    *   变量、函数、方法、函数参数、局部变量。
    ```typescript
    // Good
    let userName = 'Alice';
    function calculateTotalAmount(): number { /* ... */ }
    const getUserById = (id: string) => { /* ... */ };
    ```
*   **私有/受保护成员**：
    *   **TypeScript 推荐使用 `private` / `protected` 关键字**：这是 TypeScript 提供的语言特性，在编译时会进行检查。
    *   **旧的约定 (`_leadingUnderscore`)**：在 JavaScript 中，以一个下划线开头 (`_`) 表示内部或私有成员，这种约定在 TypeScript 中仍然可以使用，但不如 `private` 关键字强烈。
    ```typescript
    class MyClass {
      private _internalData: any[] = []; // 优先使用 private 关键字
      protected _protectedMethod() { /* ... */ }
    }
    ```

### 4.2 类、接口、类型别名、枚举

*   **`PascalCase` (大驼峰命名法 / PascalCase)**：每个单词的首字母大写，不使用下划线。
    *   类、接口、类型别名、枚举类型。
    ```typescript
    // Good
    class UserAccount { /* ... */ }
    interface IUserService { /* ... */ } // 注意：TypeScript 社区通常不推荐 'I' 前缀
    type UserID = string;
    enum UserStatus { Active, Inactive }
    ```
*   **接口名的 `I` 前缀**：在 C# 等语言中，接口名通常以 `I` 开头（如 `IUserService`）。在 TypeScript 社区中，这个前缀的接受度不高。通常建议接口名直接使用其描述性名称，如果可能与类名冲突，再考虑添加 `I` 或其他后缀（如 `Service` vs `ServiceGateway`）。**推荐不使用 `I` 前缀**。

    ```typescript
    // Recommended
    interface UserService { /* ... */ }

    // Less recommended in TypeScript
    interface IUserService { /* ... */ }
    ```

### 4.3 常量

*   **`ALL_CAPS` (全大写，下划线分隔)**：所有字母大写，单词之间用下划线 `_` 分隔。用于表示程序生命周期内不变的全局常量。
    *   对于简单的、模块内部的常量，可以使用 `camelCase` 和 `const` 关键字。
    ```typescript
    // Good
    const MAX_CONNECTION_LIMIT = 100;
    const DEFAULT_TIMEOUT_MS = 5000;

    // 对于局部或函数内部常量，通常使用 camelCase
    const pageSize = 20;
    ```

### 4.4 文件名

*   **`kebab-case` (短横线连接式)**：所有字母小写，单词之间用短横线 `-` 连接。
    *   模块文件、组件文件。
    ```typescript
    // Good
    user-service.ts
    login-form.component.ts
    ```
*   **特殊情况**：
    *   对于 React 组件，文件名可以与组件名一致，使用 `PascalCase`（如 `UserList.tsx`）。
    *   对于包含多个导出的小工具函数文件，可以使用 `snake_case` 或 `camelCase`。

## 五、类型系统实践 (Type System Best Practices)

充分利用 TypeScript 的类型系统是编写高质量 TypeScript 代码的关键。

### 5.1 明确类型声明 (Explicit Type Annotations)

*   **默认推断**：TypeScript 具有强大的类型推断能力，在简单情况下可以省略类型声明。
*   **导出函数/变量**：所有导出的函数参数、返回值和变量都应有明确的类型声明。
*   **复杂逻辑**：在复杂逻辑或计算中，显式声明类型有助于提高可读性和减少错误。

    ```typescript
    // Good (明确声明，尤其对于导出)
    function add(a: number, b: number): number {
      return a + b;
    }

    const userName: string = 'Alice';

    // 允许省略类型推断明确的简单情况
    let count = 0; // count 被推断为 number

    // Bad (不明确的类型，可能导致 any)
    function subtract(a, b) { // a, b, 返回值都为 any
      return a - b;
    }
    ```

### 5.2 避免使用 `any`

*   **最后的手段**：`any` 类型会禁用 TypeScript 的类型检查，应尽可能避免使用。它只应在无法确定类型、或与遗留 JavaScript 代码交互时作为最后的手段。
*   **更精确的类型**：尽可能使用更精确的类型，如 `unknown`、`object`、`Record<string, unknown>`，并通过类型守卫 (`type guards`) 或断言 (`type assertions`) 进行类型细化。

    ```typescript
    // Good (使用 unknown 或具体类型)
    function processUnknown(data: unknown) {
      if (typeof data === 'string') {
        console.log(data.toUpperCase());
      }
    }

    interface User {
      id: string;
      name: string;
    }
    const users: User[] = [];

    // Bad (滥用 any)
    function processAny(data: any) {
      console.log(data.name); // 运行时可能出错
    }
    const config: any = {};
    ```

### 5.3 接口 (`interface`) vs 类型别名 (`type`)

*   **首选 `interface` 用于定义对象结构**：`interface` 更适合声明对象的结构，并且支持声明合并（Declaration Merging），这对于库的扩展很有用。
*   **`type` 用于复杂类型或联合类型**：`type` 更适合定义联合类型、交叉类型、元组类型或字面量类型。

    ```typescript
    // Good (interface 用于对象)
    interface UserProfile {
      id: string;
      name: string;
      email?: string;
    }

    // Good (type 用于联合类型或字面量)
    type UserStatus = 'active' | 'inactive' | 'pending';
    type UserID = string;
    type Coordinate = [number, number]; // 元组类型
    ```

### 5.4 严格性检查 (`tsconfig.json`)

*   **启用所有严格模式**：强烈建议在 `tsconfig.json` 中启用所有严格模式选项，特别是 `strict: true`。
    *   `noImplicitAny`: 防止隐式的 `any` 类型。
    *   `noImplicitReturns`: 检查函数所有代码路径是否都有返回值。
    *   `noFallthroughCasesInSwitch`: 防止 switch 语句的 fall-through 错误。
    *   `strictNullChecks`: 启用严格的 null 和 undefined 检查。
    *   `strictPropertyInitialization`: 检查类属性是否在构造函数中初始化。
    *   `alwaysStrict`: 将每个文件解析为严格模式。
*   **好处**：这些选项能捕捉到大量的潜在错误，显著提高代码的健壮性。

    ```json
    // tsconfig.json
    {
      "compilerOptions": {
        "target": "es2020",
        "module": "commonjs",
        "strict": true, // 启用所有严格类型检查选项
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "outDir": "./dist",
        "rootDir": "./src"
      },
      "include": ["src/**/*.ts"],
      "exclude": ["node_modules", "dist"]
    }
    ```

### 5.5 类型守卫 (`Type Guards`)

*   **运行时类型检查**：使用类型守卫在运行时缩小联合类型的范围，帮助编译器更好地理解变量的类型。
*   **`typeof`、`instanceof`**：内置的类型守卫。
*   **自定义类型守卫**：函数返回值为 `parameter is Type` 形式。

    ```typescript
    // Good
    interface Bird {
      fly(): void;
      layEggs(): void;
    }

    interface Fish {
      swim(): void;
      layEggs(): void;
    }

    function isBird(pet: Bird | Fish): pet is Bird {
      return (pet as Bird).fly !== undefined;
    }

    function move(pet: Bird | Fish) {
      if (isBird(pet)) {
        pet.fly(); // TypeScript 现在知道 pet 是 Bird 类型
      } else {
        pet.swim(); // pet 是 Fish 类型
      }
    }
    ```

## 六、模块与导入 (Modules and Imports)

### 6.1 绝对导入 vs 相对导入

*   **统一策略**：在项目中选择一种一致的导入策略。
*   **路径别名**：对于大型项目，使用 `tsconfig.json` 中的 `paths` 配置路径别名（如 `@/components`），可以使导入路径更简洁、更稳定。

    ```json
    // tsconfig.json
    {
      "compilerOptions": {
        "baseUrl": ".",
        "paths": {
          "@/*": ["src/*"]
        }
      }
    }
    ```
    ```typescript
    // Good (使用路径别名)
    import { Button } from '@/components/ui/button';

    // Good (相对导入用于同目录或子目录)
    import { helperFunction } from './utils';

    // Bad (深层相对导入，难以维护)
    import { Button } from '../../../../components/ui/button';
    ```

### 6.2 默认导出 vs 命名导出

*   **优先使用命名导出**：命名导出通常更清晰，易于静态分析和重构，并且可以避免命名冲突。
*   **默认导出用于单文件组件或单一主要功能**：如果一个模块只有一个主要导出（如 React 组件），可以使用默认导出。

    ```typescript
    // module.ts
    // Good (命名导出)
    export const PI = 3.14;
    export function add(a: number, b: number) { /* ... */ }

    // Bad (当有多个导出时，默认导出会模糊意图)
    // export default { PI, add };

    // component.ts (例如 React 组件)
    // Good (默认导出用于单一主要功能)
    export default function MyComponent() { /* ... */ }
    ```

## 七、其他编程建议

### 7.1 解构 (Destructuring)

*   **提高可读性**：使用对象和数组解构来提取变量，使代码更简洁。
*   **明确性**：当只关心对象或数组的少数属性时，解构非常有用。

    ```typescript
    // Good
    const user = { name: 'Alice', age: 30, city: 'NY' };
    const { name, age } = user; // 明确提取 name 和 age

    function processUser({ name, age }: { name: string; age: number }) { /* ... */ }
    ```

### 7.2 展开运算符 (Spread Syntax)

*   **简化复制和合并**：用于复制数组/对象或合并多个数组/对象。

    ```typescript
    // Good
    const arr1 = [1, 2];
    const arr2 = [...arr1, 3, 4]; // [1, 2, 3, 4]

    const obj1 = { a: 1 };
    const obj2 = { ...obj1, b: 2 }; // { a: 1, b: 2 }
    ```

### 7.3 条件语句

*   **三元运算符**：对于简单的条件表达式，使用三元运算符 `condition ? trueValue : falseValue`。
*   **早期返回/守卫子句**：在函数开头处理错误条件或提前退出的逻辑，避免深层嵌套的 `if-else` 结构。

    ```typescript
    // Good (三元运算符)
    const status = isActive ? 'Active' : 'Inactive';

    // Good (早期返回)
    function process(data: any) {
      if (!data) {
        return; // 提前退出
      }
      // ... 正常逻辑
    }
    ```

### 7.4 枚举 (Enums)

*   **字面量枚举**：优先使用字符串字面量联合类型或数字字面量联合类型，而非 TypeScript 的 `enum` 关键字。
    *   `enum` 在编译后会生成额外的 JavaScript 代码，并且可能会引入一些不直观的行为。
    *   字面量联合类型可以达到类似的效果，且更简洁，与运行时 JavaScript 保持一致。

    ```typescript
    // Good (字面量联合类型)
    type UserRole = 'admin' | 'editor' | 'viewer';
    const currentUserRole: UserRole = 'admin';

    // Less recommended (TypeScript enum)
    enum LegacyUserRole {
      Admin,
      Editor,
      Viewer,
    }
    const legacyUserRole = LegacyUserRole.Admin;
    ```
    如果确实需要一个反向映射（例如，将字符串转换为数字，或在调试时方便地查看名称），`enum` 仍然是一个选择，但请注意其编译产物。

## 八、总结

TypeScript 编码规范是编写高质量、可维护、类型安全代码的关键。它融合了 JavaScript 的最佳实践和 TypeScript 强大的类型系统。

*   **自动化是基石**：充分利用 `ESLint` 和 `Prettier` 等工具，让它们自动化处理代码风格和大部分潜在错误。
*   **拥抱类型系统**：积极使用类型声明、严格模式，并避免 `any`。这能显著提高代码的健壮性和可维护性。
*   **遵循社区约定**：采用被广泛接受的命名、模块和文件组织规范。
*   **清晰与简洁**：始终以提高代码可读性为目标，编写简洁、明确的代码。

通过持续学习和实践这些规范，你的 TypeScript 代码将更加专业、易于协作，并能更好地利用语言的优势。