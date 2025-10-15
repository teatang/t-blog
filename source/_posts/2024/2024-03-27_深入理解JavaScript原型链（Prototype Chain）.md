---
title: 深入理解JavaScript原型链（Prototype Chain）
date: 2024-03-27 06:24:00
tags:
  - 2024
  - JavaScript
  - 原型链
  - 编程语法
categories:
  - 前端技术
  - JavaScript
---

> **JavaScript 的原型链 (Prototype Chain)** 是其实现继承的核心机制，也是理解 JavaScript 面向对象编程的关键。与 C++ 或 Java 等传统面向对象语言通过类（class）来实现继承不同，JavaScript 是一种**基于原型 (Prototype-based)** 的语言。这意味着对象可以直接从其他对象继承属性和方法。

{% note info %}
**核心思想**：每个 JavaScript 对象都有一个指向其**原型 (prototype)** 的内部链接。当访问一个对象的属性或方法时，如果该对象本身没有这个属性或方法，JavaScript 就会沿着这条链向上查找，直到找到该属性或方法，或者查找到原型链的末端（`null`）。
{% endnote %}

## 一、理解原型链的基石：`[[Prototype]]`、`__proto__` 和 `prototype`

在深入原型链之前，我们需要区分三个核心概念：

### 1.1 1. `[[Prototype]]` (隐式原型)

*   这是一个存在于**每个 JavaScript 对象**上的**内部属性**。
*   它指向该对象的**原型对象**。
*   它是**真正**构成原型链的链接。
*   在 ES5 之后，可以通过 `Object.getPrototypeOf()` 方法访问。
*   **注意**：`[[Prototype]]` 是语言规范中的概念，是不可直接访问的内部属性。

### 1.2 2. `__proto__` (非标准属性)

*   这是一个**访问器属性**（getter/setter），暴露了对象的 `[[Prototype]]`。
*   它在 ES6 之前是非标准的，但现在已被大多数浏览器实现，并成为 ES6 标准的一部分。
*   **尽管如此，不推荐直接使用 `__proto__`** 来读写对象的原型，因为它的性能开销大，并且会影响引擎优化。
*   推荐使用 `Object.getPrototypeOf()` 和 `Object.setPrototypeOf()` 方法来操作对象的原型。

**示例：`[[Prototype]]` & `__proto__`**

```javascript
let obj = {};
let arr = [];
let func = function() {};

console.log(Object.getPrototypeOf(obj) === Object.prototype); // true
console.log(Object.getPrototypeOf(arr) === Array.prototype);   // true
console.log(Object.getPrototypeOf(func) === Function.prototype); // true

// obj.__proto__ 实际上就是 obj 的 [[Prototype]]
console.log(obj.__proto__ === Object.prototype);          // true
console.log(arr.__proto__ === Array.prototype);             // true
console.log(func.__proto__ === Function.prototype);         // true
```

### 1.3 3. `prototype` (显式原型)

*   这是一个存在于**函数对象**上的属性。
*   它被称为**构造函数的原型属性**。
*   它指向一个**原型对象**，这个原型对象将作为使用该函数 `new` 关键字创建的**所有实例的 `[[Prototype]]`**。
*   简而言之，`Func.prototype` 是 `new Func()` 产生的**实例**的 `[[Prototype]]`。

**示例：`prototype`**

```javascript
// 构造函数
function Person(name) {
  this.name = name;
}

// 在 Person.prototype 上添加方法
Person.prototype.sayHello = function() {
  console.log(`Hello, my name is ${this.name}`);
};

let person1 = new Person("Alice");
let person2 = new Person("Bob");

person1.sayHello(); // 输出: Hello, my name is Alice
person2.sayHello(); // 输出: Hello, my name is Bob

// 实例的 [[Prototype]] 指向构造函数的 prototype 属性
console.log(Object.getPrototypeOf(person1) === Person.prototype); // true
console.log(person1.__proto__ === Person.prototype);             // true (不推荐直接用 __proto__)

// Person.prototype 是一个普通对象，它也有自己的 [[Prototype]]
console.log(Object.getPrototypeOf(Person.prototype) === Object.prototype); // true
```

**总结三者关系：**

{% mermaid %}
graph TD
    subgraph Instances of Constructor
        A[instance1]
        B[instance2]
    end

    subgraph Constructor Function
        C[Constructor Function]
    end

    subgraph Prototype Object
        D[Constructor.prototype Object]
    end

    subgraph Base Object
        E[Object.prototype]
    end

    subgraph End of Chain
        F[null]
    end

    A -- [[Prototype]] / __proto__ --> D
    B -- [[Prototype]] / __proto__ --> D
    C -- prototype --> D
    D -- [[Prototype]] / __proto__ --> E
    E -- [[Prototype]] / __proto__ --> F

    style A fill:#f9f,stroke:#333,stroke-width:2px;
    style B fill:#f9f,stroke:#333,stroke-width:2px;
    style C fill:#9cf,stroke:#333,stroke-width:2px;
    style D fill:#fc9,stroke:#333,stroke-width:2px;
    style E fill:#ccf,stroke:#333,stroke-width:2px;
    style F fill:#ccc,stroke:#333,stroke-width:2px;
{% endmermaid %}

## 二、原型链的工作机制

当尝试访问一个对象的属性或方法时，JavaScript 引擎会按照以下步骤进行查找：

1.  **首先，在对象自身查找**：检查该对象实例是否直接拥有这个属性或方法。
2.  **如果未找到，则沿着原型链向上查找**：
    *   查找该对象的 `[[Prototype]]`（即 `__proto__` 所指向的原型对象）。
    *   如果原型对象上找到了，则返回该属性或方法。
    *   如果未找到，则继续查找原型对象的 `[[Prototype]]`。
3.  **重复步骤2**：直到查找到原型链的末端，即 `Object.prototype`。
4.  **如果查找到 `Object.prototype` 仍未找到**：
    *   如果 `Object.prototype` 上没有该属性或方法，且其 `[[Prototype]]` 为 `null`，则说明整个原型链上都没有该属性或方法。
    *   对于属性访问，将返回 `undefined`。
    *   对于方法调用，会抛出 `TypeError`。

### 2.1 1. 属性查找示例

```javascript
function Vehicle(wheels) {
  this.wheels = wheels;
}

Vehicle.prototype.getWheels = function() {
  return this.wheels;
};

function Car(wheels, brand) {
  Vehicle.call(this, wheels); // 继承父类的属性
  this.brand = brand;
}

// 核心继承步骤：将 Car.prototype 的 [[Prototype]] 指向 Vehicle.prototype
Car.prototype = Object.create(Vehicle.prototype);
Car.prototype.constructor = Car; // 修复 constructor 指向

Car.prototype.getBrand = function() {
  return this.brand;
};

let myCar = new Car(4, "BMW");

console.log(myCar.brand);     // 1. 在 myCar 自身找到 brand
console.log(myCar.getBrand());// 2. 在 myCar 自身未找到 getBrand，沿着 myCar.[[Prototype]] (Car.prototype) 找到 getBrand

console.log(myCar.wheels);    // 1. 在 myCar 自身找到 wheels
console.log(myCar.getWheels()); // 2. 在 myCar 自身未找到 getWheels，沿着 myCar.[[Prototype]] (Car.prototype) 查找，未找到
                                // -> 沿着 Car.prototype.[[Prototype]] (Vehicle.prototype) 查找，找到 getWheels

// 如果访问一个不存在的属性
console.log(myCar.model);     // 沿着整个原型链查找，最终返回 undefined
```

### 2.2 2. 属性修改/删除示例

属性的**赋值操作**不会去原型链上查找，而是在对象自身创建或修改属性。

```javascript
let obj = { a: 1 };
let protoObj = { b: 2 };
Object.setPrototypeOf(obj, protoObj); // obj 的原型是 protoObj

console.log(obj.b); // 2 (从原型链上查找)

obj.b = 10;         // 在 obj 自身创建了属性 b
console.log(obj.b); // 10 (从 obj 自身查找)
console.log(protoObj.b); // 2 (原型对象上的 b 未受影响)

delete obj.b;       // 删除 obj 自身的属性 b
console.log(obj.b); // 2 (又从原型链上查找到了 protoObj 上的 b)
```

## 三、`constructor` 属性

每个原型对象（例如 `Person.prototype`、`Array.prototype`、`Object.prototype`）都有一个 `constructor` 属性，它指向关联的构造函数。

```javascript
function Dog(name) {
  this.name = name;
}

Dog.prototype.bark = function() {
  console.log(`${this.name} barks!`);
};

let myDog = new Dog("Buddy");

console.log(Dog.prototype.constructor === Dog); // true
console.log(myDog.constructor === Dog);         // true (通过原型链查找)

// 当我们手动设置原型时，需要修复 constructor 属性：
function Animal() {}
function Cat(name) { this.name = name; }

Cat.prototype = Object.create(Animal.prototype);
// Cat.prototype.constructor 现在指向 Animal
console.log(Cat.prototype.constructor === Animal); // true
// 正常情况下期望 Cat.prototype.constructor 指向 Cat
// 所以需要修复：
Cat.prototype.constructor = Cat;
console.log(Cat.prototype.constructor === Cat);   // true
```

修复 `constructor` 的重要性在于，它可以帮助我们确定一个对象的“类型”或创建它的构造函数，尤其在某些工具函数中会用到。

## 四、原型链与 ES6 `class` 语法糖

ES6 引入了 `class` 关键字，提供了一种更清晰、更接近传统面向对象语言语法的**语法糖**来定义类和实现继承。然而，其底层仍然是基于原型链的。

```javascript
class Animal {
  constructor(name) {
    this.name = name;
  }
  eat() {
    console.log(`${this.name} is eating.`);
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name); // 调用父类的构造函数
    this.breed = breed;
  }
  bark() {
    console.log(`${this.name} (${this.breed}) barks!`);
  }
}

let daisy = new Dog("Daisy", "Golden Retriever");
daisy.eat(); // Output: Daisy is eating. (从 Animal.prototype 继承)
daisy.bark(); // Output: Daisy (Golden Retriever) barks! (Dog.prototype 上的方法)

// 验证其原型链
console.log(Object.getPrototypeOf(daisy) === Dog.prototype);        // true
console.log(Object.getPrototypeOf(Dog.prototype) === Animal.prototype); // true
console.log(Object.getPrototypeOf(Animal.prototype) === Object.prototype); // true
console.log(Object.getPrototypeOf(Object.prototype) === null);      // true
```

上述 `class` 示例的原型链结构图：

{% mermaid %}
graph TD
    A["daisy (instance)"] -- [[Prototype]] / __proto__ --> B[Dog.prototype]
    B -- [[Prototype]] / __proto__ --> C[Animal.prototype]
    C -- [[Prototype]] / __proto__ --> D[Object.prototype]
    D -- [[Prototype]] / __proto__ --> E[null]

    style A fill:#f9f,stroke:#333,stroke-width:2px;
    style B fill:#fc9,stroke:#333,stroke-width:2px;
    style C fill:#9cf,stroke:#333,stroke-width:2px;
    style D fill:#ccf,stroke:#333,stroke-width:2px;
    style E fill:#ccc,stroke:#333,stroke-width:2px;
{% endmermaid %}

## 五、原型链的优缺点

### 5.1 1. 优点

*   **内存效率**：方法和属性只存储在原型对象上一次，所有实例共享这些方法和属性，节省内存。
*   **灵活的继承**：易于实现多层继承，且可以在运行时动态地修改对象的原型。
*   **链式查找**：允许对象从原型链上继承属性和方法，代码复用性高。

### 5.2 2. 缺点

*   **复杂性**：对于初学者来说，原型链的概念可能比较抽象和难以理解。
*   **不易直接修改**：直接修改 `Object.prototype` 等内置原型可能会影响所有对象，导致不可预测的行为。
*   **属性遮蔽 (Shadowing)**：如果实例创建了与原型链上同名的属性，会“遮蔽”原型链上的属性，这在某些情况下可能不是期望的行为。
*   **`this` 指向问题**：在原型方法中，`this` 始终指向调用该方法的对象实例，但在异步回调等场景下需要注意 `this` 的绑定。

## 六、总结

JavaScript 的原型链是其对象模型的核心，理解它对于掌握 JavaScript 的继承机制至关重要。

*   **核心概念**：每个对象都有一个 `[[Prototype]]` 内部链接，指向其原型对象。
*   **查找机制**：当访问对象属性时，会沿着原型链向上查找，直到找到或到达链的末端 `null`。
*   **`__proto__`**：非标准但广泛实现的属性，暴露了 `[[Prototype]]`，不推荐直接使用。
*   **`prototype`**：构造函数特有的属性，指向其实例的 `[[Prototype]]`。
*   **`constructor`**：原型对象上的属性，指向其构造函数。
*   **ES6 `class`**：是原型链的语法糖，底层机制不变。

掌握原型链，不仅能帮助你更好地编写和理解 JavaScript 代码，也能更好地利用其灵活性和强大的面向对象特性。