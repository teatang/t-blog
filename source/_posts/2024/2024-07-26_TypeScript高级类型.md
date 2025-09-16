---
title: TypeScript高级类型
date: 2024-07-26 06:24:00
tags: 
    - 2024
    - 技术相关
    - JavaScript
    - TypeScript
categories: TypeScript
---

{% note info %}
`TypeScript`高级类型是增强类型系统灵活性和精确性的核心工具，主要包括以下关键类型及其应用场景：
{% endnote %}

## 一、交叉类型(Intersection Types)
通过&合并多个类型，新类型需同时满足所有成员类型的特性。典型应用包括混入(Mixin)模式和对象属性合并：

```typescript
interface A { a: number }
interface B { b: string }
type C = A & B; // 必须包含a和b属性
```
该特性在混合类功能时尤其有用，例如合并Person和Programmer类的属性和方法
## 二、联合类型(Union Types)
使用|声明变量可接受多种类型中的任意一种，需配合类型保护确保类型安全：

```typescript
function printId(id: string | number) {
  if (typeof id === 'string') console.log(id.toUpperCase());
  else console.log(id.toFixed(2));
}
```

## 三、映射类型(Mapped Types)
通过keyof和泛型实现类型转换，内置工具类型包括：
- Partial<T>：使所有属性可选
- Readonly<T>：使属性只读
- Pick<T, K>：选取部分属性
- Omit<T, K>：排除指定属性
```typescript
# Partial<T> 
type Partial<T> = { [P in keyof T]?: T[P] }; 

# Readonly<T>
type Readonly<T> = { readonly [P in keyof T]: T[P] }; 

# Pick<T, K>
type Pick<T, K extends keyof T> = { [P in K]: T[P] };

# Omit<T, K>
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
```

## 四、条件类型(Conditional Types)
通过T extends U ? X : Y实现动态类型推导，典型应用包括：
- Exclude<T, U>：从T中排除U类型
- Extract<T, U>：提取T中符合U的类型
- NonNullable<T>：排除null/undefined
```typescript
# Exclude<T, U>
type Exclude<T, U> = T extends U ? never : T;

# Extract<T, U>
type Extract<T, U> = T extends U ? T : never;

# NonNullable<T>
type NonNullable<T> = T extends null | undefined ? never : T;
```

## 五、模板字面量类型
TypeScript 4.1+支持基于字符串模板的类型操作：

```typescript
type HttpMethod = 'GET' | 'POST' | 'PUT';
type ApiPath = `/api/${string}`;
```
> 可用于精确约束路由格式或API路径

## 六、类型推断与泛型约束
通过infer关键字提取嵌套类型，结合泛型约束实现高级模式：
```typescript
# ReturnType<T>
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
```
该机制广泛用于工具类型库开发