---
title: TypeScript高级类型
date: 2024-07-26 06:24:00
tags: 
    - 2024
    - 前端技术
    - JavaScript
    - TypeScript
    - 编程语法
categories: 
  - 前端技术
  - TypeScript
---

> **TypeScript 高级类型** 提供了强大的工具，允许开发者以更灵活、更精确的方式定义和操作类型。这些高级类型不仅增强了代码的类型安全性，还提升了开发体验，使得复杂的数据结构和业务逻辑能够更清晰地表达和维护。掌握 TypeScript 的这些高级特性，是成为一名高效 TypeScript 开发者的关键。

{% note info %}
**核心思想**：高级类型允许我们基于现有类型进行转换、组合、提取，以及根据不同条件生成新类型，从而构建出更健壮、更具表达力的类型系统。
{% endnote %}

## 一、联合类型 (Union Types)

联合类型表示一个值可以是多种类型中的任意一种。使用 `|` 符号连接不同的类型。

### 1.1 定义与使用

```typescript
// 定义一个联合类型，表示一个变量可以是 string 或 number
type StringOrNumber = string | number;

let id: StringOrNumber;
id = "123"; // OK
id = 123;   // OK
// id = true; // Error: Type 'boolean' is not assignable to type 'StringOrNumber'.

function printId(id: StringOrNumber) {
  console.log(`Your ID is: ${id}`);
}

printId("abc");
printId(123);
```

### 1.2 联合类型与类型守卫 (Type Guards)

当使用联合类型时，你通常需要根据值的实际类型执行不同的操作。**类型守卫** 允许 TypeScript 编译器推断出变量在特定代码块内的具体类型。

**常见的类型守卫方法：**

*   **`typeof` 类型守卫**：适用于原始类型 (string, number, boolean, symbol, bigint, undefined, function, object)。
*   **`instanceof` 类型守卫**：适用于类实例。
*   **`in` 操作符类型守卫**：适用于检查对象是否具有某个属性。
*   **字面量类型守卫** (判等缩小类型)。
*   **自定义类型守卫 (User-Defined Type Guard)**。

#### 1.2.1 `typeof` 类型守卫

```typescript
function printIdDetail(id: StringOrNumber) {
  if (typeof id === "string") {
    // TypeScript 知道这里 id 是 string 类型
    console.log(id.toUpperCase()); // 可以使用 string 的方法
  } else {
    // TypeScript 知道这里 id 是 number 类型
    console.log(id.toFixed(2)); // 可以使用 number 的方法
  }
}

printIdDetail("hello"); // HELLO
printIdDetail(123.456); // 123.46
```

#### 1.2.2 `instanceof` 类型守卫

```typescript
class Dog {
  bark() { console.log('Woof!'); }
}
class Cat {
  meow() { console.log('Meow!'); }
}

type Pet = Dog | Cat;

function makeSound(pet: Pet) {
  if (pet instanceof Dog) {
    pet.bark(); // pet 被缩小为 Dog 类型
  } else {
    pet.meow(); // pet 被缩小为 Cat 类型
  }
}

makeSound(new Dog()); // Woof!
makeSound(new Cat()); // Meow!
```

#### 1.2.3 `in` 操作符类型守卫

```typescript
interface Bird {
  fly(): void;
  layEggs(): void;
}

interface Fish {
  swim(): void;
  layEggs(): void;
}

type Animal = Bird | Fish;

function move(animal: Animal) {
  if ("fly" in animal) {
    // TypeScript 知道这里 animal 是 Bird 类型
    animal.fly();
  } else {
    // TypeScript 知道这里 animal 是 Fish 类型
    animal.swim();
  }
}

const bird: Bird = { fly: () => console.log('flying'), layEggs: () => {} };
const fish: Fish = { swim: () => console.log('swimming'), layEggs: () => {} };

move(bird); // flying
move(fish); // swimming
```

#### 1.2.4 字面量类型守卫 (判等缩小类型)

```typescript
interface Circle {
  kind: "circle";
  radius: number;
}

interface Square {
  kind: "square";
  sideLength: number;
}

type Shape = Circle | Square;

function getArea(shape: Shape): number {
  if (shape.kind === "circle") {
    // shape 缩小为 Circle
    return Math.PI * shape.radius ** 2;
  } else {
    // shape 缩小为 Square
    return shape.sideLength ** 2;
  }
}

console.log(getArea({ kind: "circle", radius: 5 }));   // 78.539...
console.log(getArea({ kind: "square", sideLength: 4 })); // 16
```

#### 1.2.5 自定义类型守卫 (User-Defined Type Guard)

通过返回一个类型谓词 `parameterName is Type` 来告诉 TypeScript 编译器在函数返回 `true` 时，参数的类型是什么。

```typescript
interface Administrator {
  name: string;
  privileges: string[];
}

interface User {
  name: string;
  startDate: Date;
}

type Person = Administrator | User;

// 自定义类型守卫函数
function isAdministrator(person: Person): person is Administrator {
  return (person as Administrator).privileges !== undefined;
}

function processPerson(person: Person) {
  if (isAdministrator(person)) {
    // person 缩小为 Administrator
    console.log(`Admin ${person.name} has privileges: ${person.privileges.join(', ')}`);
  } else {
    // person 缩小为 User
    console.log(`User ${person.name} joined on: ${person.startDate.toLocaleDateString()}`);
  }
}

const admin: Administrator = { name: "Max", privileges: ["create-server"] };
const user: User = { name: "Anna", startDate: new Date() };

processPerson(admin); // Admin Max has privileges: create-server
processPerson(user);  // User Anna joined on: ...
```

## 二、交叉类型 (Intersection Types)

交叉类型将多个类型合并为一个类型，这意味着一个值必须同时具备所有这些类型的特性。使用 `&` 符号连接不同的类型。

### 2.1 定义与使用

```typescript
interface Colorful {
  color: string;
}

interface Printable {
  print(): void;
}

// 交叉类型：既有 color 属性，又有 print 方法
type ColorfulPrintable = Colorful & Printable;

const obj: ColorfulPrintable = {
  color: "red",
  print() {
    console.log(this.color);
  }
};

obj.print(); // red
```

### 2.2 交叉类型与合并属性

当多个接口或类型具有相同的属性时，交叉类型会尝试合并它们。

*   **原始类型属性**：如果相同属性的类型是原始类型（如 `number`, `string`），则它们必须是**兼容的联合类型**。如果类型不兼容（如 `string & number`），则结果为 `never`。
*   **非原始类型属性**：如果相同属性的类型是接口或对象字面量，则会进行**深层合并**。

```typescript
interface A {
  x: number;
  y: string;
}

interface B {
  y: number; // 注意：与 A.y 类型不兼容
  z: boolean;
}

// type C = A & B;
// 在这种情况下，C 的 y 属性类型会变成 string & number，即 never。
// C 的实际类型会是 { x: number; y: never; z: boolean; }
// 导致 C 类型的变量无法被赋值 (除非 y 被赋值为 never 值，这是不可能的)

interface UserInfo {
    id: number;
    name: string;
    permissions: 'read' | 'write';
}

interface UserConfig {
    theme: 'dark' | 'light';
    notifications: boolean;
    permissions: 'admin' | 'read'; // 冲突的 permissions
}

// 交叉后，permissions 变为 'read' (因为 'read' 是 'read' | 'write' 和 'admin' | 'read' 的交集)
type FullUser = UserInfo & UserConfig;

const fullUser: FullUser = {
    id: 1,
    name: "Alice",
    theme: "dark",
    notifications: true,
    permissions: "read" // 必须是 "read"，因为它是两个联合类型的交集
}

// const invalidUser: FullUser = {
//     id: 2,
//     name: "Bob",
//     theme: "light",
//     notifications: false,
//     permissions: "admin" // Error: Type '"admin"' is not assignable to type '"read"'.
// }
```

## 三、类型别名 (Type Aliases)

类型别名允许你为任何类型定义一个新的名称。这对于复杂类型（如联合类型、交叉类型、函数类型）或为了代码可读性都非常有用。

### 3.1 定义与使用

```typescript
// 为字符串字面量联合定义别名
type EventName = 'click' | 'hover' | 'scroll';
let event: EventName = 'click';

// 为函数类型定义别名
type Callback = (data: string) => void;
function registerCallback(cb: Callback) {
  cb("Data received!");
}

registerCallback((msg) => console.log(msg)); // Data received!

// 为对象类型定义别名
type Point = {
  x: number;
  y: number;
};
let p: Point = { x: 10, y: 20 };
```

### 3.2 接口 (Interfaces) vs 类型别名 (Type Aliases)

两者都可以定义对象类型，但存在一些关键区别：

| 特性       | Interface (接口)                                      | Type Alias (类型别名)                                    |
| :--------- | :---------------------------------------------------- | :------------------------------------------------------- |
| **可扩展性** | 可以通过 `extends` 继承，也可以被同名接口合并 (Declaration Merging) | 不能被同名合并，但可以通过交叉类型 (`&`) 扩展             |
| **声明形式** | 只能声明对象类型、函数类型、类类型                     | 可以声明任何类型，包括原始类型、联合类型、交叉类型、元组等 |
| **应用场景** | 更常用于定义可扩展的对象类型和实现接口 (classes `implements`) | 更加灵活，用于定义复杂类型、为现有类型起别名               |

**声明合并 (Declaration Merging)** 是接口的一个独有特性：

```typescript
// 接口可以通过多次声明合并
interface User {
  name: string;
}

interface User {
  age: number;
}

// 最终 User 类型是 { name: string; age: number; }
const user: User = { name: "Alice", age: 30 };

// 类型别名不能合并
// type Product = { id: number; };
// type Product = { name: string; }; // Error: Duplicate identifier 'Product'.
```

## 四、类型断言 (Type Assertions)

类型断言告诉 TypeScript 编译器：“相信我，我知道这个变量的类型是什么。”它不会进行运行时检查，仅仅是在编译时起作用。

### 4.1 语法

*   **`<Type>value`** (不推荐在 JSX 中使用，因为可能与 JSX 语法冲突)
*   **`value as Type`** (推荐)

### 4.2 使用场景

当你明确知道某个变量的类型，但 TypeScript 编译器无法识别时使用。

```typescript
const someValue: any = "this is a string";

// 方法一：尖括号语法
let strLength1: number = (<string>someValue).length;
console.log(strLength1); // 16

// 方法二：as 语法 (推荐)
let strLength2: number = (someValue as string).length;
console.log(strLength2); // 16

// 强制转换会带来风险，因为没有运行时检查
const numValue: any = 123;
// let numLength: number = (numValue as string).length; // 编译时 OK，运行时会是 undefined.length 报错！
// console.log(numLength);
```

**注意**：类型断言不是类型转换，它不会改变值的运行时类型。滥用类型断言会降低类型安全性。

## 五、字面量类型 (Literal Types)

字面量类型允许你指定一个变量只能是某个特定的原始字面量值（字符串、数字、布尔值）。

### 5.1 定义与使用

```typescript
type Direction = "up" | "down" | "left" | "right";
let dir: Direction = "up";
// dir = "forward"; // Error: Type '"forward"' is not assignable to type 'Direction'.

type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE";
function handleRequest(method: HTTPMethod, url: string) {
  console.log(`Handling ${method} request for ${url}`);
}

handleRequest("GET", "/api/users");
// handleRequest("HEAD", "/api/data"); // Error: Type '"HEAD"' is not assignable to type 'HTTPMethod'.

type Enabled = true;
let enabled: Enabled = true;
// enabled = false; // Error
```

字面量类型常与联合类型结合使用，创建更精确的集合类型。

## 六、模板字面量类型 (Template Literal Types)

TypeScript 4.1 引入，允许你基于字符串字面量构建新的字符串字面量类型，支持字符串插值语法。

### 6.1 定义与使用

```typescript
type World = "world";
type Greeting = `hello ${World}`; // "hello world"

let x: Greeting = "hello world";
// let y: Greeting = "hello typescript"; // Error

type Color = 'red' | 'blue';
type Size = 'small' | 'medium' | 'large';

// 组合出所有可能的颜色-大小组合
type ItemVariant = `${Color}-${Size}`;
// "red-small" | "red-medium" | "red-large" | "blue-small" | "blue-medium" | "blue-large"

let item1: ItemVariant = "red-medium";
// let item2: ItemVariant = "green-small"; // Error

// 结合类型参数
type EventName<T extends string> = `${T}Changed` | `${T}Deleted`;
type UserEvents = EventName<"user">; // "userChanged" | "userDeleted"
type ProductEvents = EventName<"product">; // "productChanged" | "productDeleted"
```

## 七、索引签名 (Index Signatures)

索引签名允许你描述那些可能具有任意数量属性的对象类型，但这些属性的键和值都符合特定的类型模式。

### 7.1 定义与使用

```typescript
// 键是 string 类型，值是 string 类型
interface StringDictionary {
  [key: string]: string;
}

const myDict: StringDictionary = {
  name: "Alice",
  city: "New York",
};

console.log(myDict["name"]); // Alice
// myDict.age = 30; // Error: Type 'number' is not assignable to type 'string'.

// 键是 number 类型，值是 string 类型 (常用于表示类似数组的对象)
interface StringArray {
  [index: number]: string;
}

const names: StringArray = ["Alice", "Bob", "Charlie"];
console.log(names[0]); // Alice

// 索引签名可以与具名属性共存，但具名属性的类型必须兼容索引签名
interface MixedDictionary {
  [key: string]: string | number; // 索引签名
  name: string;                  // 具名属性必须兼容
  age: number;                   // 具名属性必须兼容
}

const mixed: MixedDictionary = {
  name: "Eve",
  age: 25,
  hobby: "reading" // OK, key and value match index signature
};
```

**注意**：索引签名中的键类型只能是 `string`、`number`、`symbol` 或模板字面量类型。如果同时存在 `string` 和 `number` 索引签名，`number` 索引的值类型必须是 `string` 索引值类型的子类型。

## 八、泛型 (Generics)

泛型是 TypeScript 中实现代码复用和类型安全的关键特性，它允许你在定义函数、类、接口时使用类型参数，从而使这些结构能够与多种类型一起工作，而不是局限于单一类型。

### 8.1 为什么需要泛型？

考虑一个返回数组最后一个元素的函数：

```typescript
// 没有泛型：返回 any，丢失类型信息
function getLastAny(arr: any[]): any {
  return arr[arr.length - 1];
}
const lastNumAny = getLastAny([1, 2, 3]); // lastNumAny 是 any
// const resAny: string = lastNumAny; // 运行时可能出错，但编译时无法发现

// 没有泛型：每次要支持新类型都要重新实现
function getLastNumber(arr: number[]): number {
  return arr[arr.length - 1];
}
function getLastString(arr: string[]): string {
  return arr[arr.length - 1];
}
// etc.
```

使用泛型可以解决这个问题：

```typescript
function getLast<T>(arr: T[]): T {
  return arr[arr.length - 1];
}

const lastNum = getLast([1, 2, 3]);       // lastNum 自动推断为 number
const lastStr = getLast(["a", "b", "c"]); // lastStr 自动推断为 string
const lastBool = getLast([true, false]);  // lastBool 自动推断为 boolean

// 明确指定类型参数
const specificNum = getLast<number>([1, 2, 3]);
// const errorNum = getLast<string>([1, 2, 3]); // Error: Type 'number' is not assignable to type 'string'.
```

### 8.2 泛型函数

定义一个函数时，在函数名后使用 `<T>` 来声明类型参数 `T`。

```typescript
function merge<T, U>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 };
}

const merged = merge({ name: "Alice" }, { age: 30 }); // merged: { name: string; age: number; }
console.log(merged.name, merged.age); // Alice 30

// 泛型约束 (Generic Constraints)
// 我们可以限制类型参数 T 的类型，例如要求 T 必须有一个 length 属性
interface Lengthwise {
  length: number;
}

function loggingIdentity<T extends Lengthwise>(arg: T): T {
  console.log(arg.length); // T 现在保证有 length 属性
  return arg;
}

loggingIdentity("hello");  // 5, OK
loggingIdentity([1, 2, 3]); // 3, OK
// loggingIdentity(3);       // Error: Argument of type 'number' is not assignable to parameter of type 'Lengthwise'.
```

### 8.3 泛型接口

接口也可以使用泛型来提高其通用性。

```typescript
interface Pair<K, V> {
  key: K;
  value: V;
}

let numStringPair: Pair<number, string> = { key: 1, value: "one" };
let stringBoolPair: Pair<string, boolean> = { key: "isOpen", value: true };

// 泛型接口也可以作为函数参数
function processPair<TKey, TValue>(pair: Pair<TKey, TValue>) {
  console.log(`Key: ${pair.key}, Value: ${pair.value}`);
}

processPair(numStringPair); // Key: 1, Value: one
```

### 8.4 泛型类

类也可以使用泛型，通常用于构建可重用、类型安全的集合类或辅助类。

```typescript
class GenericBox<T> {
  private value: T;

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  getValue(): T {
    return this.value;
  }

  setValue(newValue: T) {
    this.value = newValue;
  }
}

let stringBox = new GenericBox<string>("Hello");
console.log(stringBox.getValue()); // Hello
stringBox.setValue("World");
// stringBox.setValue(123); // Error: Argument of type 'number' is not assignable to parameter of type 'string'.

let numberBox = new GenericBox(123); // 类型推断为 number
console.log(numberBox.getValue()); // 123
```

## 九、条件类型 (Conditional Types)

TypeScript 2.8 引入，允许你根据一个类型是否可以赋值给另一个类型来推断出一个新的类型，语法类似于 JavaScript 的三元运算符：`T extends U ? X : Y`。

### 9.1 定义与使用

```typescript
// 如果 T 可以赋值给 U，则结果类型是 X，否则是 Y
type Check<T, U> = T extends U ? true : false;

type IsString = Check<string, string>; // true
type IsNumber = Check<number, string>; // false
type IsUnionString = Check<"hello" | "world", string>; // true
type IsUnionMixed = Check<"hello" | 123, string>; // (Check<"hello", string> | Check<123, string>) => (true | false) => boolean

// `infer` 关键字：在条件类型中用于引入一个新的类型变量来捕获在 `extends` 子句中推断的类型。
// 提取函数返回类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;

type FuncResult = ReturnType<() => string>;    // string
type AsyncFuncResult = ReturnType<() => Promise<number>>; // Promise<number>
type NoFuncResult = ReturnType<number>;        // any

// 提取数组元素的类型
type ElementType<T> = T extends (infer U)[] ? U : T;
type StringArrayElement = ElementType<string[]>; // string
type NumberArrayElement = ElementType<number[]>; // number
type NonArrayElement = ElementType<boolean>;     // boolean

// 提取 Promise 的解析值类型
type UnpackPromise<T> = T extends Promise<infer U> ? U : T;
type ResolvedString = UnpackPromise<Promise<string>>; // string
type ResolvedNumber = UnpackPromise<number>;          // number
```

### 9.2 分布式条件类型 (Distributive Conditional Types)

当 `T` 是一个联合类型，并且条件类型中的 `extends` 运算符左侧直接是裸类型参数 `T` 时，条件类型会分别作用于联合类型中的每个成员。

```typescript
type ToArray<T> = T extends any ? T[] : never;

type StringOrNumberArray = ToArray<string | number>;
// 相当于 (string extends any ? string[] : never) | (number extends any ? number[] : never)
// 结果是 string[] | number[]

type NotDistributive<T> = [T] extends [any] ? T[] : never;
type NotDistributiveResult = NotDistributive<string | number>;
// 结果是 (string | number)[]， 因为 [string | number] 作为一个整体参与判断
```

## 十、映射类型 (Mapped Types)

TypeScript 2.1 引入，允许你从旧类型中创建新类型，其方式类似于使用 `for ... in` 遍历对象属性。它可以转换一个对象类型的每个属性。

### 10.1 定义与使用

语法：`{ [P in K]: T }`，其中 `K` 通常是一个联合类型或 `keyof AnyType`。

```typescript
interface UserProperties {
  id: number;
  name: string;
  age: number;
}

// 可选属性类型：将所有属性变为可选
type Partial<T> = {
  [P in keyof T]?: T[P];
};

type OptionalUser = Partial<UserProperties>;
/*
{
  id?: number;
  name?: string;
  age?: number;
}
*/

// 只读属性类型：将所有属性变为只读
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

type ReadonlyUser = Readonly<UserProperties>;
/*
{
  readonly id: number;
  readonly name: string;
  readonly age: number;
}
*/

// 可选属性转换为必选属性 (移除 ?)
type Required<T> = {
  [P in keyof T]-?: T[P];
};

interface OptionalProps {
  a?: string;
  b?: number;
}
type AllRequired = Required<OptionalProps>;
/*
{
  a: string;
  b: number;
}
*/

// 只读属性转换为可写属性 (移除 `readonly`)
type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

interface ReadonlyProps {
  readonly x: string;
  readonly y: number;
}
type AllMutable = Mutable<ReadonlyProps>;
/*
{
  x: string;
  y: number;
}
*/
```

### 10.2 键重映射 (Key Remapping with `as`)

TypeScript 4.1 引入，允许你在映射类型中通过 `as` 关键字来改变属性的键名。

```typescript
type Getters<T> = {
  [P in keyof T as `get${Capitalize<string & P>}`]: T[P];
};

interface Person {
  name: string;
  age: number;
}

type PersonGetters = Getters<Person>;
/*
{
  getName: string;
  getAge: number;
}
*/

// 只选择特定类型的属性进行映射 (过滤属性)
type PickByValueType<T, V> = {
  [P in keyof T as T[P] extends V ? P : never]: T[P];
};

interface MyData {
  id: number;
  name: string;
  isActive: boolean;
  score: number;
}

type OnlyNumbers = PickByValueType<MyData, number>;
/*
{
  id: number;
  score: number;
}
*/
```

## 十一、内置工具类型 (Utility Types)

TypeScript 内置了许多有用的工具类型，它们基于上述高级类型（尤其是映射类型和条件类型）实现，极大地简化了常见的类型转换和操作。

### 11.1 `Partial<T>`

使 `T` 的所有属性可选。

```typescript
interface Todo {
  title: string;
  description: string;
  completed: boolean;
}

function updateTodo(todo: Todo, fieldsToUpdate: Partial<Todo>) {
  return { ...todo, ...fieldsToUpdate };
}

const todo1 = { title: "organize desk", description: "clear clutter", completed: false };
const updatedTodo = updateTodo(todo1, { description: "throw out trash" });
// updatedTodo: { title: "organize desk", description: "throw out trash", completed: false }
```

### 11.2 `Readonly<T>`

使 `T` 的所有属性只读。

```typescript
interface Point {
  x: number;
  y: number;
}

const p1: Readonly<Point> = { x: 10, y: 20 };
// p1.x = 20; // Error: Cannot assign to 'x' because it is a read-only property.
```

### 11.3 `Record<K, T>`

构造一个对象类型，其属性键为 `K` (可以是字面量联合类型或 `string`/`number` 等)，属性值为 `T`。

```typescript
type Page = "home" | "about" | "contact";
interface PageInfo {
  title: string;
  path: string;
}

const pages: Record<Page, PageInfo> = {
  home: { title: "Home Page", path: "/" },
  about: { title: "About Us", path: "/about" },
  contact: { title: "Contact Us", path: "/contact" },
};
// const invalidPages: Record<Page, PageInfo> = { home: { title: "Home" } }; // Error: Missing properties
```

### 11.4 `Pick<T, K>`

从类型 `T` 中选择一组属性 `K`（`K` 必须是 `T` 的属性名的联合类型），构造一个新的类型。

```typescript
interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatarUrl: string;
}

type UserSummary = Pick<UserProfile, "id" | "name">;
/*
{
  id: number;
  name: string;
}
*/
const summary: UserSummary = { id: 1, name: "Alice" };
```

### 11.5 `Omit<T, K>`

从类型 `T` 中排除一组属性 `K`，构造一个新的类型。

```typescript
interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatarUrl: string;
}

type UserDetailsWithoutAvatar = Omit<UserProfile, "avatarUrl">;
/*
{
  id: number;
  name: string;
  email: string;
}
*/
const userDetails: UserDetailsWithoutAvatar = { id: 1, name: "Bob", email: "bob@example.com" };
```

### 11.6 `Exclude<T, U>`

从类型 `T` 中排除可以赋值给 `U` 的类型成员（通常用于联合类型）。

```typescript
type AllColors = "red" | "green" | "blue" | "white" | "black";
type BasicColors = "red" | "green" | "blue";

type RemainingColors = Exclude<AllColors, BasicColors>; // "white" | "black"
```

### 11.7 `Extract<T, U>`

从类型 `T` 中提取可以赋值给 `U` 的类型成员（通常用于联合类型）。

```typescript
type AllColors = "red" | "green" | "blue" | "white" | "black";
type BasicColors = "red" | "green" | "pink"; // pink 不在 AllColors 中

type CommonColors = Extract<AllColors, BasicColors>; // "red" | "green"
```

### 11.8 `NonNullable<T>`

从类型 `T` 中排除 `null` 和 `undefined`。

```typescript
type PossibleNull = string | number | null | undefined;
type NotNull = NonNullable<PossibleNull>; // string | number
```

### 11.9 `Parameters<T>`

提取函数类型 `T` 的参数类型组成的元组类型。

```typescript
function greet(name: string, age: number): string {
  return `Hello ${name}, you are ${age} years old.`;
}

type GreetParams = Parameters<typeof greet>; // [name: string, age: number]
const params: GreetParams = ["Alice", 30];
```

### 11.10 `ReturnType<T>`

提取函数类型 `T` 的返回类型。

```typescript
function calculateSum(a: number, b: number): number {
  return a + b;
}

type SumResult = ReturnType<typeof calculateSum>; // number
```

### 11.11 `Awaited<T>` (TypeScript 4.5+)

递归地解包 `Promise` 类型，提取其最终的解析值类型。

```typescript
type P1 = Promise<string>;
type P2 = Promise<Promise<number>>;
type P3 = Promise<string | Promise<boolean>>;
type P4 = Promise<string | Promise<boolean> | Promise<number>[]>; // Unwraps only the top-level promise if inner is not directly assignable

type AwaitedP1 = Awaited<P1>; // string
type AwaitedP2 = Awaited<P2>; // number
type AwaitedP3 = Awaited<P3>; // string | boolean
type AwaitedP4 = Awaited<P4>; // string | boolean | Promise<number>[]
type StringOrNumber = Awaited<string | Promise<number>>; // string | number
```

## 十二、总结

TypeScript 的高级类型是其强大类型系统的基石，它们使得我们能够：

*   **增强类型安全性**：通过精确的类型定义，减少运行时错误。
*   **提高代码可读性和可维护性**：复杂逻辑可以用清晰的类型结构表示。
*   **实现强大的代码补全和重构**：IDE 可以根据类型信息提供更智能的帮助。
*   **构建可复用和灵活的代码**：泛型和工具类型允许创建适用于多种场景的通用组件。

从基础的联合类型和交叉类型，到进阶的条件类型、映射类型以及内置工具类型，每一种高级类型都有其独特的应用场景。熟练掌握它们将显著提升你的 TypeScript 开发效率和代码质量。
