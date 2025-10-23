---
title: Python Pandas详解：数据处理与分析的瑞士军刀
date: 2023-02-21 06:24:00
tags:
    - 2023
    - Python
    - NumPy
    - Pandas
    - 数据处理
categories: 
    - Python
    - 库
---

> **Pandas** 是 Python 中用于数据分析和处理的核心库。它提供了一套高性能、易于使用的数据结构，最主要的是 **`DataFrame`**（二维表格数据）和 **`Series`**（一维带标签数组），用于快速处理和分析结构化数据（如 CSV、Excel、数据库表格数据）。Pandas 以其直观的语法和强大的功能，成为数据科学家和数据工程师的首选工具。

{% note info %}
核心思想：Pandas 将表格数据抽象为 `DataFrame` 和 `Series` 对象，提供类似 SQL 和 Excel 的操作，通过向量化和 C/Cython 实现的底层优化，极大提升了数据处理效率。
{% endnote %}

## 一、为什么选择 Pandas？

在数据驱动的时代，我们经常需要处理各种形式的表格数据。Python 原生的数据结构（如列表、字典）虽然灵活，但在处理大量、复杂、异构的表格数据时显得力不从心。Pandas 解决了这些痛点：

1.  **直观的数据结构**：`DataFrame` 和 `Series` 提供了强大的标签索引功能，使得数据操作更加直观，无需关注底层实现。
2.  **高效的数据操作**：底层基于 NumPy 优化，利用 C 和 Cython 实现，对于大规模数据操作性能优异。
3.  **丰富的数据处理能力**：
    *   **数据清洗**：缺失值处理、重复值处理、异常值检测。
    *   **数据转换**：重塑 (reshape)、透视 (pivot)、合并 (merge)、连接 (join)。
    *   **数据选择**：强大的基于标签、位置、布尔值的索引和切片。
    *   **时间序列分析**：强大的日期时间处理功能。
4.  **易于与文件交互**：轻松读写各种数据格式，如 CSV, Excel, SQL 数据库, JSON, HDF5 等。
5.  **与主流科学计算库集成**：无缝对接 NumPy, SciPy, Matplotlib, Scikit-learn 等。

## 二、安装 Pandas

Pandas 并非 Python 的内置库，需要通过 `pip` 安装：

```bash
pip install pandas
```

安装完成后，通常会将其导入为 `pd`：

```python
import pandas as pd
import numpy as np # Pandas 依赖 NumPy
```

## 三、Pandas 数据结构

Pandas 主要有两种核心数据结构：`Series` 和 `DataFrame`。

### 3.1 `Series` (一维带标签数组)

`Series` 类似于一维数组（NumPy `ndarray`），但它带有一个索引（标签）。

```python
# 从列表创建 Series
s = pd.Series([1, 3, 5, np.nan, 6, 8])
print("从列表创建 Series:\n", s)
# 0    1.0
# 1    3.0
# 2    5.0
# 3    NaN
# 4    6.0
# 5    8.0
# dtype: float64

# 创建带指定索引的 Series
s2 = pd.Series([10, 20, 30], index=['a', 'b', 'c'])
print("\n带索引的 Series:\n", s2)
# a    10
# b    20
# c    30
# dtype: int64

# 从字典创建 Series
data_dict = {'Math': 90, 'Science': 85, 'English': 92}
s3 = pd.Series(data_dict)
print("\n从字典创建 Series:\n", s3)
# Math       90
# Science    85
# English    92
# dtype: int64

# Series 的属性
print(f"\ns2 的索引: {s2.index}")
print(f"s2 的值: {s2.values}")
print(f"s2 的数据类型: {s2.dtype}")
```

`Series` 支持类似 NumPy 数组的索引和切片，以及基于标签的访问：

```python
# 基于位置索引
print(f"s[0]: {s[0]}")     # 1.0
# 基于标签索引
print(f"s2['b']: {s2['b']}")   # 20
# 切片
print(f"s[:3]:\n{s[:3]}")
# s[('a', 'c')]: 多个标签索引
print(f"s2[['a', 'c']]:\n{s2[['a', 'c']]}")
```

### 3.2 `DataFrame` (二维表格数据)

`DataFrame` 是 Pandas 最重要的数据结构，可以看作是由 Series 组成的字典（共享同一个索引），或具有行和列的二维表格。

```python
# 从字典创建 DataFrame
data = {
    'Name': ['Alice', 'Bob', 'Charlie', 'David'],
    'Age': [25, 30, 35, 28],
    'City': ['New York', 'London', 'Paris', 'New York'],
    'Salary': [70000, 80000, 90000, np.nan] # np.nan 表示缺失值
}
df = pd.DataFrame(data)
print("从字典创建 DataFrame:\n", df)
#       Name  Age      City   Salary
# 0    Alice   25  New York  70000.0
# 1      Bob   30    London  80000.0
# 2  Charlie   35     Paris  90000.0
# 3    David   28  New York      NaN

# 指定索引和列
df2 = pd.DataFrame(data, index=['a', 'b', 'c', 'd'],
                   columns=['Name', 'City', 'Age', 'Salary'])
print("\n指定索引和列的 DataFrame:\n", df2)

# 从 NumPy 数组创建 DataFrame
dates = pd.date_range('20230101', periods=6)
df3 = pd.DataFrame(np.random.randn(6, 4), index=dates, columns=list('ABCD'))
print("\n从 NumPy 数组创建 DataFrame:\n", df3)

# DataFrame 的属性
print(f"\ndf 的索引: {df.index}")
print(f"df 的列: {df.columns}")
print(f"df 的形状 (行, 列): {df.shape}")
print(f"df 的数据类型:\n{df.dtypes}")
```

## 四、数据输入/输出 (I/O)

Pandas 支持多种数据格式的读写：

```python
# CSV 文件
# df.to_csv('my_data.csv', index=False) # 保存为 CSV
# df_from_csv = pd.read_csv('my_data.csv') # 读取 CSV

# Excel 文件
# df.to_excel('my_data.xlsx', sheet_name='Sheet1', index=False)
# df_from_excel = pd.read_excel('my_data.xlsx', sheet_name='Sheet1')

# JSON 文件
# df.to_json('my_data.json', orient='records')
# df_from_json = pd.read_json('my_data.json', orient='records')

# SQL 数据库 (需要安装相应的数据库连接驱动，如 psycopg2, pymysql)
# from sqlalchemy import create_engine
# engine = create_engine('postgresql://user:password@host:port/database')
# df.to_sql('my_table', engine, if_exists='replace', index=False)
# df_from_sql = pd.read_sql_table('my_table', engine)
```

## 五、数据选择与索引

### 5.1 基本选择

```python
# 选择单列 (返回 Series)
print(f"df['Name']:\n{df['Name']}")
# 选择多列 (返回 DataFrame)
print(f"df[['Name', 'Age']]:\n{df[['Name', 'Age']]}")
```

### 5.2 `loc` 和 `iloc`

*   **`loc`**: 基于**标签**进行索引和切片。
*   **`iloc`**: 基于**位置**（整数）进行索引和切片。

```python
df_idx = pd.DataFrame(data, index=['r1', 'r2', 'r3', 'r4'])
print("\n带自定义索引的 DataFrame:\n", df_idx)

# loc:
# 单行单列
print(f"df_idx.loc['r1', 'Name']: {df_idx.loc['r1', 'Name']}") # Alice
# 多行多列
print(f"df_idx.loc[['r1', 'r3'], ['Name', 'City']]:\n{df_idx.loc[['r1', 'r3'], ['Name', 'City']]}")
# 切片 (包含结束标签)
print(f"df_idx.loc['r1':'r3', 'Name':'City']:\n{df_idx.loc['r1':'r3', 'Name':'City']}")

# iloc:
# 单行单列
print(f"df_idx.iloc[0, 0]: {df_idx.iloc[0, 0]}") # Alice
# 多行多列
print(f"df_idx.iloc[[0, 2], [0, 2]]:\n{df_idx.iloc[[0, 2], [0, 2]]}")
# 切片 (不包含结束位置)
print(f"df_idx.iloc[0:3, 0:3]:\n{df_idx.iloc[0:3, 0:3]}")
```

### 5.3 布尔索引

使用条件表达式选择数据。

```python
# 选择年龄大于 30 的行
print(f"年龄大于 30 的记录:\n{df[df['Age'] > 30]}")

# 组合条件
print(f"年龄大于 28 且城市是 New York 的记录:\n{df[(df['Age'] > 28) & (df['City'] == 'New York')]}")

# 使用 isin() 方法
print(f"城市在 ['New York', 'London'] 中的记录:\n{df[df['City'].isin(['New York', 'London'])]}")
```

## 六、数据清洗与准备

### 6.1 缺失值处理

*   `isnull()` / `isna()`: 检测缺失值（返回布尔型 DataFrame）。
*   `notnull()`: 检测非缺失值。
*   `dropna()`: 删除含有缺失值的行或列。
*   `fillna()`: 填充缺失值。

```python
print("原始 DataFrame (含缺失值):\n", df)

# 检测缺失值
print(f"\n缺失值检测:\n{df.isnull()}")
print(f"\n每列缺失值数量:\n{df.isnull().sum()}")

# 删除含有缺失值的行 (至少有一个缺失值)
df_dropped_rows = df.dropna()
print("\n删除含有缺失值的行:\n", df_dropped_rows)

# 删除所有为 NaN 的行
df_dropped_all = df.dropna(how='all') # 只删除所有值都是 NaN 的行

# 填充缺失值
df_filled_na = df.fillna(0) # 将所有 NaN 填充为 0
print("\n填充 NaN 为 0:\n", df_filled_na)

# 填充缺失值，使用指定列的平均值
df['Salary'] = df['Salary'].fillna(df['Salary'].mean())
print("\n使用 Salary 列平均值填充:\n", df)
```

### 6.2 重复值处理

*   `duplicated()`: 检测重复行。
*   `drop_duplicates()`: 删除重复行。

```python
df_dup = pd.DataFrame({
    'col1': ['A', 'B', 'A', 'C'],
    'col2': [1, 2, 1, 3]
})
print("\n含有重复值的 DataFrame:\n", df_dup)

print(f"\n检测重复行:\n{df_dup.duplicated()}")
# 0    False
# 1    False
# 2     True
# 3    False
# dtype: bool

print(f"\n删除重复行:\n{df_dup.drop_duplicates()}")
```

### 6.3 数据类型转换

`astype()` 方法用于改变 Series 或 DataFrame 列的数据类型。

```python
df['Age'] = df['Age'].astype(float) # 将 Age 列转换为浮点型
print(f"\nAge 列数据类型转换后:\n{df.dtypes}")
```

## 七、数据操作与转换

### 7.1 应用函数 (`apply`)

`apply()` 方法可以在 Series 或 DataFrame 的行/列上应用函数。

```python
# 对 Series 应用函数
df['Name_Upper'] = df['Name'].apply(lambda x: x.upper())
print(f"\n应用 upper() 函数:\n{df[['Name', 'Name_Upper']]}")

# 对 DataFrame 的行或列应用函数
def categorize_age(age):
    if age < 30:
        return 'Young'
    else:
        return 'Adult'

df['Age_Category'] = df['Age'].apply(categorize_age)
print(f"\n应用自定义函数:\n{df[['Age', 'Age_Category']]}")
```

### 7.2 分组与聚合 (`groupby`)

`groupby()` 是 Pandas 中最强大的功能之一，用于按一个或多个键对 DataFrame 进行分组，然后对每个组执行聚合操作（如求和、均值、计数等）。

```python
# 按 'City' 列分组，并计算每个城市的平均年龄和薪水
city_group = df.groupby('City')
print(f"\n按城市分组并计算平均值:\n{city_group.mean(numeric_only=True)}")
#           Age     Salary
# City
# London   30.0  80000.000
# New York 26.5  70000.000
# Paris    35.0  90000.000

# 多个聚合函数
print(f"\n按城市分组，计算年龄的均值和最大值:\n{df.groupby('City')['Age'].agg(['mean', 'max'])}")

# 多列分组
df_multi_group = df.groupby(['City', 'Age_Category'])['Salary'].mean()
print(f"\n按城市和年龄类别计算平均薪水:\n{df_multi_group}")
```

### 7.3 合并、连接、拼接 (`merge`, `join`, `concat`)

*   **`concat`**: 沿着某个轴（行或列）堆叠 (`stack`) 多个 DataFrame 或 Series。
*   **`merge`**: 类似于 SQL 的 JOIN 操作，根据一个或多个键合并 DataFrame。
*   **`join`**: 类似于 `merge`，但默认是根据索引进行连接。

```python
df1 = pd.DataFrame({'key': ['K0', 'K1', 'K2', 'K3'],
                    'A': ['A0', 'A1', 'A2', 'A3'],
                    'B': ['B0', 'B1', 'B2', 'B3']})
df2 = pd.DataFrame({'key': ['K0', 'K1', 'K4', 'K5'],
                    'C': ['C0', 'C1', 'C4', 'C5'],
                    'D': ['D0', 'D1', 'D4', 'D5']})

# concat (行堆叠)
df_concat = pd.concat([df1, df2], ignore_index=True)
print("\nconcat 示例 (按行堆叠):\n", df_concat)
#   key    A    B    C    D
# 0  K0   A0   B0  NaN  NaN
# 1  K1   A1   B1  NaN  NaN
# ...

# merge (内连接)
df_merge_inner = pd.merge(df1, df2, on='key', how='inner')
print("\nmerge 示例 (内连接):\n", df_merge_inner)
#   key   A   B   C   D
# 0  K0  A0  B0  C0  D0
# 1  K1  A1  B1  C1  D1

# merge (左连接)
df_merge_left = pd.merge(df1, df2, on='key', how='left')
print("\nmerge 示例 (左连接):\n", df_merge_left)
#   key   A   B    C    D
# 0  K0  A0  B0   C0   D0
# 1  K1  A1  B1   C1   D1
# 2  K2  A2  B2  NaN  NaN
# 3  K3  A3  B3  NaN  NaN
```

### 7.4 透视表 (`pivot_table`)

创建电子表格风格的透视表。

```python
df_sales = pd.DataFrame({
    'Date': pd.to_datetime(['2023-01-01', '2023-01-01', '2023-01-02', '2023-01-02', '2023-01-03']),
    'Region': ['East', 'West', 'East', 'West', 'East'],
    'Product': ['A', 'B', 'A', 'A', 'B'],
    'Sales': [100, 150, 120, 180, 200]
})
print("\n原始销售数据:\n", df_sales)

pivot_table = df_sales.pivot_table(
    values='Sales', # 聚合的值
    index='Date',   # 行索引
    columns='Region', # 列索引
    aggfunc='sum'   # 聚合函数
)
print("\n销售透视表 (按日期和区域汇总销售额):\n", pivot_table)
# Region      East    West
# Date
# 2023-01-01   100.0   150.0
# 2023-01-02   120.0   180.0
# 2023-01-03   200.0     NaN
```

## 八、时间序列处理

Pandas 对时间序列数据有非常强大的支持。

```python
# 创建日期范围索引
time_series_index = pd.date_range('2023-01-01', periods=10, freq='D')
ts = pd.Series(np.random.randn(10), index=time_series_index)
print("\n时间序列 Series:\n", ts)

# 时间序列切片
print(f"\n2023-01-03 到 2023-01-07 的数据:\n{ts['2023-01-03':'2023-01-07']}")

# 重采样 (Resampling)
# 按周求和 'W' -> Week
print(f"\n按周重采样求和:\n{ts.resample('W').sum()}")
# 按月求平均 'M' -> Month
print(f"\n按月重采样求平均:\n{ts.resample('M').mean()}")
```

{% mermaid %}
graph TD
    A[数据源: CSV, Excel, DB, JSON] --> B(pd.read_csv/excel/sql/json)
    B --> C[DataFrame/Series]
    C -- 探索性数据分析 (EDA) --> D["df.head(), df.info(), <br>df.describe(), nunique(), <br>value_counts()"]
    C -- 数据选择 & 过滤 --> E["df[], df.loc[], df.iloc[], <br>布尔索引, query()"]
    C -- 数据清洗 --> F["df.fillna(), df.dropna(), <br>df.drop_duplicates(), replace(), <br>rename()"]
    C -- 数据转换 & 特征工程 --> G["df.apply(), df.astype(), <br>df.groupby(), df.merge(), <br>df.pivot_table(), pd.concat(), <br>pd.get_dummies()"]
    G --> H{分析结果/处理后的数据}
    H -- 可视化 --> I[Matplotlib, Seaborn, Plotly]
    H -- 存储 --> J["df.to_csv/excel/sql/json, <br>to_pickle()"]
    J --> K[报告/模型训练/进一步分析]

{% endmermaid %}


## 九、性能优化

虽然 Pandas 已经非常高效，但在处理非常大的数据集时，仍需注意性能：

*   **避免 Python 循环**：尽可能使用 Pandas 内置的向量化操作，如 `df['col'] * 2` 而非 `for x in df['col']: ...`。
*   **使用 `apply` 的替代方案**：对于简单的函数，`map`, `apply`, `assign` 或直接的向量化操作通常比 `for` 循环快。对于复杂的行操作，考虑 `df.iterrows()` (慢) 或 `df.itertuples()` (稍快)。
*   **选择合适的数据类型**：使用更精确的（例如 `int8` 而非 `int64`）或分类 (`category`) 类型可以节省内存和加速操作。
*   **优化 `groupby` 操作**：`groupby` 结合 `agg` 可以一次性执行多个聚合函数。
*   **分块处理**：对于内存无法容纳的超大数据集，可以分块读取和处理。

## 十、总结与进阶

Pandas 是 Python 数据科学生态系统中不可或缺的工具。它以其直观的 API 和强大的功能，极大地简化了数据的加载、清洗、转换和分析过程。

**进阶方向：**

*   **多级索引 (MultiIndex)**：处理更复杂的分层数据。
*   **窗口函数 (Rolling / Expanding)**：进行移动平均、累计和等时间序列分析。
*   **Categorical 类型**：优化内存使用和加速分类数据处理。
*   **高效内存管理**：了解 Pandas 内部如何存储数据以及如何优化内存使用。
*   **时间序列高级操作**：偏移 (shift), 滞后 (lag) 等。
*   **与 Matplotlib/Seaborn 结合**：深入学习数据可视化。
*   **使用 Pandarallel/Dask**：处理更大规模的数据集，实现并行计算。

掌握 Pandas，你将拥有强大的数据处理能力，为数据分析、机器学习和数据工程任务打下坚实基础。