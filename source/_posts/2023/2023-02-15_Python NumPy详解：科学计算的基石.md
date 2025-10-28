---
title: Python NumPy详解：科学计算的基石
date: 2023-02-15 06:24:00
tags:
    - 2023
    - Python
    - NumPy
    - 科学计算
categories: 
    - Python
    - 库
---

> **NumPy (Numerical Python)** 是 Python 中用于科学计算的核心库。它提供了一个高性能的多维数组对象 **`ndarray`**，以及用于处理这些数组的工具。NumPy 是 Python 数据科学和机器学习生态系统的基石，许多其他库（如 SciPy, Pandas, Matplotlib, Scikit-learn）都建立在 NumPy 数组之上。

{% note info %}
核心思想：NumPy 引入了高效的 `ndarray` 数据结构，通过向量化操作显著提升了 Python 处理数值数据的性能。
{% endnote %}
------

## 一、为什么选择 NumPy？

Python 语言本身处理列表等数据结构时效率较高，但对于大规模数值计算而言，原生的 Python 列表效率低下。NumPy 通过以下方式解决了这个问题：

1.  **高性能 `ndarray` 对象**：`ndarray` 存储同类型数据，在内存中连续存储，相比 Python 列表，占用的内存更少，访问速度更快。
2.  **向量化操作**：NumPy 允许对整个数组进行操作，而无需编写显式的循环。这些操作通常在 C 或 Fortran 中实现，执行速度远超 Python 循环。
3.  **广播 (Broadcasting)**：NumPy 能够对不同形状的数组执行算术运算，极大地简化了代码。
4.  **丰富的数学函数**：提供了大量的数学函数，可以直接应用于数组。
5.  **与 C/C++/Fortran 代码集成**：可以方便地集成用其他高效语言编写的代码。

## 二、安装 NumPy

`NumPy` 并非 Python 的内置库，需要通过 `pip` 安装：

```bash
pip install numpy
```

安装完成后，通常会将其导入为 `np`：

```python
import numpy as np
```

## 三、NumPy `ndarray` 对象

`ndarray` 是 NumPy 的核心，它是具有相同类型和大小的项的多维容器。

### 3.1 创建 `ndarray`

可以通过多种方式创建 `ndarray`：

*   **从 Python 列表或元组创建**：

    ```python
    arr1d = np.array([1, 2, 3, 4, 5]) # 一维数组 (向量)
    print(f"一维数组: {arr1d}, 维度: {arr1d.ndim}, 形状: {arr1d.shape}")

    arr2d = np.array([[1, 2, 3], [4, 5, 6]]) # 二维数组 (矩阵)
    print(f"二维数组:\n{arr2d}, 维度: {arr2d.ndim}, 形状: {arr2d.shape}")
    ```

*   **使用内置函数创建**：

    ```python
    # 填充 0 的数组
    zeros_arr = np.zeros((2, 3)) # 2行3列
    print(f"全零数组:\n{zeros_arr}")

    # 填充 1 的数组
    ones_arr = np.ones((3, 2))
    print(f"全一数组:\n{ones_arr}")

    # 填充指定值的数组
    full_arr = np.full((2, 2), 7)
    print(f"全7数组:\n{full_arr}")

    # 单位矩阵
    identity_matrix = np.eye(3)
    print(f"单位矩阵:\n{identity_matrix}")

    # 随机数组
    rand_arr = np.random.rand(2, 2) # 0-1 之间均匀分布
    print(f"随机数组:\n{rand_arr}")
    rand_int_arr = np.random.randint(0, 10, size=(2, 3)) # 0-10 之间的随机整数
    print(f"随机整数数组:\n{rand_int_arr}")

    # 序列数组 (类似 range())
    arange_arr = np.arange(0, 10, 2) # 从0开始，到10(不包含)，步长为2
    print(f"arange 数组: {arange_arr}")

    # 等差数列
    linspace_arr = np.linspace(0, 10, 5) # 从0到10(包含)，生成5个等差数
    print(f"linspace 数组: {linspace_arr}")
    ```

### 3.2 `ndarray` 的属性

*   `ndim`：数组的维度（轴的数量）。
*   `shape`：一个元组，表示数组每个维度的大小。
*   `size`：数组中元素的总数。
*   `dtype`：数组中元素的类型。
*   `itemsize`：数组中每个元素占用的字节数。

```python
arr = np.array([[1, 2, 3], [4, 5, 6]], dtype=np.float64)
print(f"维度: {arr.ndim}")        # 2
print(f"形状: {arr.shape}")        # (2, 3)
print(f"总元素数: {arr.size}")      # 6
print(f"数据类型: {arr.dtype}")     # float64
print(f"每个元素字节数: {arr.itemsize}") # 8 (float64 占 8 字节)
```

### 3.3 数据类型 (dtype)

NumPy 支持多种数据类型，如 `int8`, `int16`, `int32`, `int64`, `float16`, `float32`, `float64`, `bool`, `complex` 等。

```python
int_arr = np.array([1, 2, 3], dtype=np.int32)
print(f"指定 int32 类型的数组: {int_arr}, dtype: {int_arr.dtype}")

float_arr = np.array([1, 2, 3], dtype='f') # 'f' 是 float32 的简写
print(f"指定 float32 类型的数组: {float_arr}, dtype: {float_arr.dtype}")

# 类型转换
converted_arr = arr.astype(np.int32)
print(f"转换后的数组: {converted_arr}, dtype: {converted_arr.dtype}")
```

## 四、数组索引与切片

类似于 Python 列表，NumPy 数组也支持索引和切片，但可以进行多维操作。

### 4.1 基本索引

```python
arr = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])

# 访问单个元素 (行, 列)
print(f"arr[0, 0]: {arr[0, 0]}")   # 1
print(f"arr[1, 2]: {arr[1, 2]}")   # 6
```

### 4.2 切片

```python
# 访问第一行
print(f"arr[0, :]: {arr[0, :]}")    # [1 2 3]

# 访问第一列
print(f"arr[:, 0]: {arr[:, 0]}")    # [1 4 7]

# 访问子矩阵
print(f"arr[0:2, 1:3]:\n{arr[0:2, 1:3]}") # 从第0行到第1行，第1列到第2列
# [[2 3]
#  [5 6]]
```

### 4.3 布尔索引

通过布尔数组选择元素，非常强大。

```python
arr = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
bool_arr = arr > 5
print(f"布尔数组:\n{bool_arr}")
# [[False False False]
#  [False False  True]
#  [ True  True  True]]

# 挑选出大于 5 的元素
print(f"大于 5 的元素: {arr[bool_arr]}") # [6 7 8 9]
# 或者直接
print(f"大于 5 的元素: {arr[arr > 5]}") # [6 7 8 9]
```

### 4.4 花式索引 (Fancy Indexing)

使用整数数组进行索引。

```python
arr = np.array([10, 20, 30, 40, 50])
idx = np.array([0, 2, 4])
print(f"花式索引结果: {arr[idx]}") # [10 30 50]

# 在二维数组中
arr2d = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
rows = np.array([0, 1, 2])
cols = np.array([1, 0, 2])
# arr2d[rows, cols] 会分别取 arr2d[0,1], arr2d[1,0], arr2d[2,2]
print(f"花式索引 2D 结果: {arr2d[rows, cols]}") # [2 4 9]
```

## 五、数组操作

### 5.1 算术运算

NumPy 数组支持元素级的算术运算，这被称为**向量化操作**。

```python
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

print(f"a + b: {a + b}") # [5 7 9]
print(f"a * 2: {a * 2}") # [2 4 6]
print(f"a / b: {a / b}") # [0.25 0.4  0.5 ]

# 矩阵乘法
A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])
print(f"矩阵乘法 (A @ B):\n{A @ B}")
# [[1*5+2*7, 1*6+2*8],
#  [3*5+4*7, 3*6+4*8]]
# [[19 22]
#  [43 50]]
print(f"矩阵乘法 (np.dot(A, B)):\n{np.dot(A, B)}")
```

### 5.2 广播 (Broadcasting)

广播是 NumPy 处理不同形状数组之间算术运算的能力。

```python
# 数组与标量相加
arr = np.array([[1, 2, 3], [4, 5, 6]])
print(f"数组 + 标量:\n{arr + 10}")

# 不同形状数组相加
# 形状 (2, 3) 和 (1, 3) 的数组
a = np.array([[1, 2, 3], [4, 5, 6]])
b = np.array([10, 20, 30])
print(f"不同形状数组相加 (广播):\n{a + b}")
# [[1+10, 2+20, 3+30],
#  [4+10, 5+20, 6+30]]
# [[11 22 33]
#  [14 25 36]]
```

### 5.3 聚合函数 (Aggregations)

NumPy 提供了许多用于数组聚合的函数，如 `sum`, `min`, `max`, `mean`, `std` 等。

```python
arr = np.array([[1, 2, 3], [4, 5, 6]])

print(f"所有元素的和: {arr.sum()}")          # 21
print(f"所有元素的最小值: {arr.min()}")          # 1
print(f"所有元素的最大值: {arr.max()}")          # 6
print(f"所有元素的平均值: {arr.mean()}")         # 3.5
print(f"所有元素的标准差: {arr.std()}")          # 1.707...

# 沿着特定轴聚合 (axis=0 表示按列，axis=1 表示按行)
print(f"每列的和 (axis=0): {arr.sum(axis=0)}")  # [5 7 9] (1+4, 2+5, 3+6)
print(f"每行的最大值 (axis=1): {arr.max(axis=1)}") # [3 6]   (max(1,2,3), max(4,5,6))
```

### 5.4 形状操作

*   **`reshape()`**：改变数组的形状，但不改变数据。

    ```python
    arr = np.arange(9) # [0 1 2 3 4 5 6 7 8]
    reshaped_arr = arr.reshape(3, 3)
    print(f"reshape 后:\n{reshaped_arr}")
    # [[0 1 2]
    #  [3 4 5]
    #  [6 7 8]]
    ```

*   **`ravel()` / `flatten()`**：将多维数组展平为一维数组。

    ```python
    flatted_arr = reshaped_arr.ravel()  # 返回视图 (view)，数据共享
    print(f"ravel 后: {flatted_arr}")
    flatted_arr_copy = reshaped_arr.flatten() # 返回副本 (copy)，数据不共享
    print(f"flatten 后: {flatted_arr_copy}")
    ```

*   **`transpose()` / `T`**：矩阵转置。

    ```python
    arr2d = np.array([[1, 2], [3, 4]])
    transposed_arr = arr2d.T
    print(f"转置后:\n{transposed_arr}")
    # [[1 3]
    #  [2 4]]
    ```

### 5.5 合并与分割

*   **合并 (Concatenate)**：

    ```python
    a = np.array([1, 2])
    b = np.array([3, 4])
    print(f"水平合并 (np.hstack): {np.hstack((a, b))}") # [1 2 3 4]
    print(f"垂直合并 (np.vstack):\n{np.vstack((a, b))}")
    # [[1 2]
    #  [3 4]]

    a2d = np.array([[1, 2], [3, 4]])
    b2d = np.array([[5, 6], [7, 8]])
    print(f"二维数组水平合并 (np.concatenate, axis=1):\n{np.concatenate((a2d, b2d), axis=1)}")
    # [[1 2 5 6]
    #  [3 4 7 8]]
    ```

*   **分割 (Split)**：

    ```python
    arr = np.arange(12).reshape(3, 4)
    print(f"原始数组:\n{arr}")
    # [[ 0  1  2  3]
    #  [ 4  5  6  7]
    #  [ 8  9 10 11]]

    # 水平分割成两部分
    h_split = np.hsplit(arr, 2)
    print(f"水平分割:\n{h_split[0]}\n{h_split[1]}")
    # [[ 0  1]   [[ 2  3]
    #  [ 4  5]    [ 6  7]
    #  [ 8  9]]   [10 11]]

    # 垂直分割成三部分
    v_split = np.vsplit(arr, 3)
    print(f"垂直分割:\n{v_split[0]}\n{v_split[1]}\n{v_split[2]}")
    # [[ 0  1  2  3]]
    # [[ 4  5  6  7]]
    # [[ 8  9 10 11]]
    ```

## 六、线性代数

NumPy 提供了强大的线性代数功能，例如矩阵的逆、行列式、特征值等。

```python
A = np.array([[1, 2], [3, 4]])

# 矩阵的逆
inv_A = np.linalg.inv(A)
print(f"矩阵的逆:\n{inv_A}")
# 反向验证：A @ inv_A 应该接近单位矩阵
print(f"A @ inv_A:\n{A @ inv_A}") # 可能会有浮点误差

# 行列式
det_A = np.linalg.det(A)
print(f"行列式: {det_A}")

# 特征值和特征向量
eigenvalues, eigenvectors = np.linalg.eig(A)
print(f"特征值: {eigenvalues}")
print(f"特征向量:\n{eigenvectors}")
```

## 七、性能优势 (对比 Python 列表)

```python
size = 1000000
list1 = list(range(size))
list2 = list(range(size))

arr1 = np.arange(size)
arr2 = np.arange(size)

print("Python 列表相加耗时:")
%timeit [x + y for x, y in zip(list1, list2)]

print("NumPy 数组相加耗时:")
%timeit arr1 + arr2
```

（在 Jupyter Notebook 或 IPython 环境中运行以上代码，会看到 NumPy 数组运算速度远快于 Python 列表。）

{% mermaid %}
graph TD
    A[Python List] --> B{存储方式: 动态数组, 异构元素}
    B --> C{性能: 循环操作, 效率低}
    C --> D[NumPy `ndarray`]
    D --> E{存储方式: 连续内存, 同构元素}
    E --> F{性能: 向量化操作 （C/Fortran）, 效率高}
    F --> G[广播 （Broadcasting）]
    F --> H[丰富的数学函数]
    H --> I[数据科学/机器学习应用]
{% endmermaid %}

## 八、总结与进阶

NumPy 是任何 Python 科学计算任务的核心工具。熟练掌握 `ndarray` 的创建、索引、操作和各种功能，是进行数据分析、机器学习和科学研究的基础。

**进阶方向：**

*   **更多数学函数**：探索 `np.sin()`, `np.cos()`, `np.exp()`, `np.log()` 等通用函数 (Universal Functions, ufuncs)。
*   **文件 I/O**：使用 `np.save()`, `np.load()`, `np.savetxt()`, `np.loadtxt()` 等函数读写数据。
*   **结构化数组**：创建带有不同数据类型字段的复杂数组。
*   **内存视图与副本**：理解何时 NumPy 操作返回视图（共享数据）和副本（独立数据），这对于避免意外修改和优化内存使用至关重要。
*   **与 Pandas 结合**：NumPy 数组是 Pandas DataFrame 和 Series 的底层数据结构。
*   **与 Matplotlib 可视化**：使用 NumPy 数组生成数据并用 Matplotlib 进行可视化。

NumPy 的强大和灵活性使其成为 Python 生态系统中不可或缺的一部分。掌握它，你将能够更高效、更专业地处理数值数据。