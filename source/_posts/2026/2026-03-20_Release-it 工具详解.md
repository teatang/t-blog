---
title: Release-it 工具详解
date: 2026-03-20 06:24:00
tags:
  - 2026
  - CI/CD
  - Git
categories:
  - 开发工具
  - CI/CD
---

> **Release-it** 是一个功能强大、高度可配置的命令行工具，旨在**简化和自动化软件项目的版本发布过程**。它能够处理从版本号提升（根据 Semantic Versioning 规范）、Git 标签创建、项目构建、NPM 包发布，到生成更新日志（Changelog）以及推送到远程仓库等一系列任务。通过自动化这些重复且容易出错的步骤，`release-it` 大大提高了发布效率和一致性。

{% note info %}
核心思想：
-   **自动化发布流程**：将版本发布所需的多个步骤（如版本号管理、Git操作、包发布等）整合并自动化。
-   **遵守语义化版本 (SemVer)**：严格遵循 MAJOR.MINOR.PATCH 规范，确保版本号的正确性。
-   **高度可配置和可扩展**：通过配置文件和插件机制，适应各种项目和发布策略。
-   **减少人为错误**：将重复任务交给工具处理，降低手动操作引入的风险。
-   **集成 CI/CD**：完美融入持续集成/持续部署工作流，实现全自动发布。
{% endnote %}

------

## 一、为什么需要 Release-it？

软件项目的版本发布通常涉及一系列繁琐且精确的步骤：

1.  **确定下一个版本号**：根据上一次发布以来的变更，确定是发布 MAJOR、MINOR 还是 PATCH 版本。
2.  **更新 `package.json` (或类似文件) 中的版本号**。
3.  **创建 Git Commit**：将版本号更新提交到仓库。
4.  **创建 Git Tag**：使用新的版本号作为标签。
5.  **构建项目**：运行必要的构建脚本。
6.  **发布到包管理器**：例如将 NPM 包发布到 npm registry。
7.  **生成和更新更新日志 (Changelog)**。
8.  **推送到远程 Git 仓库**：包括新的提交和标签。
9.  **创建 GitHub Release**：附加发布说明和资产。

手动执行这些步骤不仅耗时，而且极易出错。例如，忘记更新版本号、标签格式错误、漏掉 Changelog 更新等都可能导致发布失败或版本历史混乱。

`release-it` 通过以下方式解决了这些问题：

*   **集中式配置**：在一个配置文件中定义所有发布步骤和规则。
*   **语义化版本推断**：可以根据 Git 提交规范（如 Conventional Commits）自动推断下一个版本号。
*   **原子化操作**：将一系列操作封装成一个命令，确保所有步骤要么全部成功，要么全部失败（在 dry run 模式下尤其有用）。
*   **Hooks 和插件**：提供了灵活的扩展机制，可以执行自定义脚本或集成第三方服务。

## 二、核心概念

### 2.1 语义化版本 (Semantic Versioning, SemVer)

`release-it` 严格遵循 SemVer 规范 (MAJOR.MINOR.PATCH)。

*   **MAJOR 版本 (2.0.0)**：当您做了不兼容的 API 变更。
*   **MINOR 版本 (1.1.0)**：当您做了向下兼容的功能性新增。
*   **PATCH 版本 (1.0.1)**：当您做了向下兼容的问题修正。

`release-it` 可以根据开发者指定的增量类型 (`patch`, `minor`, `major`)，或者通过基于约定式提交（Conventional Commits）的插件自动分析提交历史来确定下一个版本号。

### 2.2 发布流程 (Stages)

`release-it` 将发布过程分为多个有序的阶段，每个阶段都可以执行一个或多个操作，并提供钩子（hooks）来执行自定义命令。

1.  **检测阶段 (Detect)**：检查当前分支、未提交的更改、远程仓库状态等。
2.  **版本增量阶段 (Increment)**：计算下一个版本号。
3.  **挂钩阶段 (Hooks)**：执行 `before:bump` 等钩子。
4.  **更新版本号 (Bump)**：写入新版本号到 `package.json` 等文件。
5.  **Git `pre-commit` 阶段 (Git - Before Commit)**：执行 `before:git:commit` 等钩子。
6.  **Git `commit` 阶段 (Git - Commit)**：创建新的提交。
7.  **发布包 (Release)**：例如发布 NPM 包。
8.  **创建 Git Tag (Git - Tag)**：使用新版本号创建 Git Tag。
9.  **Git `push` 阶段 (Git - Push)**：推送 commits 和 tags 到远程仓库。
10. **发布 `GitHub/GitLab` Releases (Github/GitLab - Release)**：创建对应的平台 Release。
11. **完成阶段 (Release - End)**：执行 `after:release` 等钩子。

{% mermaid %}
graph LR
    subgraph ReleaseIt [Release-it 自动化发布流程]

        %% 开始/结束节点
        Start([开始发布])
        Finish([完成发布])

        %% 处理节点
        HookB1(Hooks: before:bump)
        Bump[Bump Stage: 更新版本文件]
        HookG1(Hooks: before:git:commit)
        Commit[Git Commit Stage: 提交版本更新]
        NPM(NPM Release Stage)
        GitTag[Git Tag Stage: 创建 Git Tag]
        GitPush[Git Push Stage: 推送 Commit 和 Tag]
        GitRel(GitHub/GitLab Release Stage)
        HookR1(Hooks: after:release)

        %% 决策/检查节点
        CheckD{环境检查?}
        CheckI{计算版本?}

        %% 结果节点
        ResultS(发布中止)

        %% 定义流程
        Start --> CheckD
        
        CheckD -- 成功 --> CheckI
        CheckD -- 失败 --> ResultS

        CheckI -- 成功 --> HookB1
        CheckI -- 失败 --> ResultS

        HookB1 --> Bump
        Bump --> HookG1
        Bump -- 失败 --> ResultS

        HookG1 --> Commit
        Commit --> NPM
        Commit -- 失败 --> ResultS

        NPM --> GitTag
        GitTag --> GitPush
        GitPush --> GitRel
        GitRel --> HookR1
        HookR1 --> Finish

        %% 定义节点样式类 (兼容所有模式)
        classDef success fill:#50fa7b,stroke:#50fa7b,color:#282a36;
        classDef process fill:#6272a4,stroke:#f8f8f2,color:#f8f8f2;
        classDef warning fill:#f1fa8c,stroke:#f1fa8c,color:#282a36;
        classDef failure fill:#ff5555,stroke:#ff5555,color:#ffffff;
        
        %% 应用样式类
        class Start,Finish success;
        class Bump,Commit,GitPush,GitTag,GitRel,NPM process;
        class HookB1,HookG1,HookR1 warning;
        class CheckD,CheckI warning;
        class ResultS failure;
    end
{% endmermaid %}

### 2.3 插件 (Plugins)

`release-it` 的功能可以通过插件进行扩展，例如：

*   `@release-it/conventional-changelog`: 根据约定式提交生成更新日志。
*   `@release-it/git-the-changelog`: 另一个强大的更新日志生成器。
*   `@release-it/extra-plugin`: 用于在发布前后执行额外的自定义脚步和钩子。

## 三、安装与配置

### 3.1 安装 `release-it`

在您的项目中使用 npm 或 yarn 安装 `release-it` 作为开发依赖：

```bash
# 使用 npm
npm install --save-dev release-it

# 使用 yarn
yarn add -D release-it
```

### 3.2 基础配置

`release-it` 可以通过 `package.json` [<sup>1</sup>](https://docs.npmjs.com/cli/v10/configuring-npm/package-json) 中的 `release-it` 字段或者独立的配置文件（如 `.release-it.js`, `.release-it.json`, `.release-it.yaml` 等）进行配置。推荐使用 `.release-it.js` 文件，因为它支持 JavaScript 逻辑和注释。

创建一个 `.release-it.js` 文件在项目根目录：

```javascript
// .release-it.js
module.exports = {
  git: {
    // 提交消息模板
    commitMessage: 'chore(release): release v${version}',
    // Git Tag 模板
    tagName: 'v${version}',
    // 提交所有变更，包括未暂存的
    requireCleanWorkingDir: true,
    // 强制提交，即使有未暂存的文件
    // requireCleanWorkingDir: false,
    // 要求当前分支必须是 main 或 master
    // requireBranch: 'main',
    // 在发布后推送 Git 提交和标签
    push: true,
  },
  npm: {
    // 是否跳过 NPM 包的发布
    publish: true,
    // NPM 注册表，默认为 npmjs.com
    // registry: 'https://registry.npmjs.org/',
    // 发布前运行的脚本
    // publishPath: './dist', // 如果发布的是构建后的文件，可以指定路径
  },
  github: {
    // 是否创建 GitHub Release
    release: true,
    // GitHub Release 标题
    releaseName: 'Release v${version}',
    // GitHub Release 说明
    releaseNotes: null, // 可以使用插件自动生成更新日志
  },
  plugins: {
    // 示例：使用 conventional-changelog 插件自动生成更新日志
    // '@release-it/conventional-changelog': {
    //   preset: {
    //     name: 'angular', // 或 'eslint', 'conventionalcommits', 'preset' 等
    //     // 更多配置参考 https://github.com/conventional-changelog/conventional-changelog/tree/master/packages
    //   },
    //   infile: 'CHANGELOG.md', // 指定更新日志文件
    // },
  },
  hooks: {
    // 发布前执行的命令，例如运行测试、构建项目
    'before:init': 'npm run test && npm run build',
    // 发布后执行的命令，例如通知或清理
    'after:release': 'echo Successfully released v${version} to production!',
  },
  // 提示用户确认，自动化发布通常设置为 false
  prompt: {
    ghRelease: false,
    ci: true, // 在 CI/CD 环境下禁用交互式提示
  },
};
```

### 3.3 集成 `conventional-changelog` (推荐)

为了实现自动化版本推断和更新日志生成，通常会集成 `@release-it/conventional-changelog` 插件，它依赖于 `commitlint` 强制执行的约定式提交规范。

1.  **安装插件**:
    ```bash
    npm install --save-dev @release-it/conventional-changelog
    # yarn add -D @release-it/conventional-changelog
    ```

2.  **更新 `.release-it.js` 配置**:
    ```javascript
    // .release-it.js
    module.exports = {
      git: {
        commitMessage: 'chore(release): release v${version}',
        tagName: 'v${version}',
        requireCleanWorkingDir: true,
        push: true,
      },
      npm: {
        publish: true,
        // 如果 package.json 中 private 为 true，则需要设置
        // private: false,
      },
      github: {
        release: true,
        releaseName: 'Release v${version}',
        // 使用插件生成的更新日志作为 release notes
        releaseNotes: 'echo "${changelog}"',
      },
      plugins: {
        '@release-it/conventional-changelog': {
          preset: {
            name: 'angular', // 遵循 AngularJS 的约定式提交规范
            // types: [ ... 可自定义 type 列表用于生成 changelog ]
          },
          infile: 'CHANGELOG.md', // 输出到 CHANGELOG.md 文件
        },
      },
      hooks: {
        'before:init': 'npm run test && npm run build',
        // 可以将生成的 changelog 打印出来用于调试
        // 'after:release': 'echo "Generated Changelog:\n${changelog}"',
      },
      prompt: {
        ci: true,
      },
    };
    ```
    配置 `preset: { name: 'angular', ... }` 后，`release-it` 将能够根据 `feat:`, `fix:` 等约定式提交的 `type` 来**自动推断**下一个版本号（`feat` -> `minor`, `fix` -> `patch`, `BREAKING CHANGE` -> `major`）以及生成对应的更新日志。

## 四、使用方法

### 4.1 基本发布

执行以下命令即可启动发布流程。如果配置了 `prompt.ci: true` 或在 CI 环境运行，它将自动执行所有步骤。

```bash
npx release-it
```

### 4.2 指定版本增量

您可以强制 `release-it` 以特定的 SemVer 增量进行发布：

```bash
npx release-it patch   # 发布补丁版本 (1.0.0 -> 1.0.1)
npx release-it minor   # 发布次要版本 (1.0.0 -> 1.1.0)
npx release-it major   # 发布主要版本 (1.0.0 -> 2.0.0)
```
如果配置了 `conventional-changelog` 插件，`release-it` 会自动根据提交历史推断版本号，通常无需手动指定。

### 4.3 干运行 (Dry Run)

在实际发布前，可以使用 `--dry-run` 模式进行模拟，查看 `release-it` 将会执行哪些操作，但不会实际修改文件或发布。

```bash
npx release-it --dry-run
```
这将打印出所有计划执行的步骤，而不会真正进行提交、打标签或发布等操作，是测试配置的绝佳方式。

### 4.4 在 CI/CD 环境中

将 `release-it` 集成到 CI/CD 管道是最佳实践。通常，您会为 CI/CD 系统提供一个具有发布权限的令牌（例如 GitHub Token 或 NPM Token），并禁用用户交互。

**GitHub Actions 示例**:

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches:
      - main # 只监听 main 分支的推送

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    permissions:
      contents: write # 允许写入仓库内容以创建 release 和 tag
      pull-requests: write # 如果需要创建 PR，则需要
      packages: write # 如果需要发布私有包到 GitHub Packages
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # 必须获取完整历史记录，以便 release-it 分析 commit 消息

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm' # 或 'yarn'
          registry-url: 'https://registry.npmjs.org/' # 配置 NPM registry

      - name: Install dependencies
        run: npm install

      - name: Run tests (optional)
        run: npm test

      - name: Run Release-it
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} # 自动提供，用于 GitHub API 交互
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}     # 自定义 secret，如果发布到 NPM
        run: npx release-it --ci # --ci 禁用交互式提示
```
**注意**: `GITHUB_TOKEN` 是 GitHub Actions 内置的，通常拥有足够权限。如果需要发布到 NPM，您需要创建一个 NPM Access Token 并将其存储为 GitHub Secret (`NPM_TOKEN`)。

## 五、Release-it 与其他工具的集成

### 5.1 与 Commitlint 和 Husky

为了实现全自动且规范的版本发布，`release-it` 通常与 `Commitlint` 和 `Husky` 结合使用：

1.  **开发者提交代码**：
    *   `git commit -m "feat(scope): add new feature"`
2.  **Husky 拦截 `commit-msg` 钩子**：
    *   执行 `Commitlint` 检查提交信息是否符合约定式提交规范。
3.  **如果提交信息符合规范，Commit 成功**。
4.  **当推送到 `main` 分支时 (或手动触发)**：
    *   CI/CD 流程中的 `release-it` 被触发。
    *   `release-it` 使用 `@release-it/conventional-changelog` 插件**分析所有符合规范的提交历史**。
    *   根据 `feat:`、`fix:`、`BREAKING CHANGE:` 等提交类型，`release-it` **自动推断**下一个版本号（patch, minor, major）。
    *   `release-it` 执行完整的发布流程（更新 `package.json`、生成变更日志、创建 Git Tag、推送到远程、发布 NPM 包、创建 GitHub Release）。

{% mermaid %}
graph TD
    subgraph Local [开发者工作流]
        Start([Git Commit 操作]) --> Husky[[Husky: commit-msg 钩子]]
        Husky --> Lint{Commitlint 校验}
        
        Lint -- 不符合规范 --> FailD(提交被拦截/报错)
        Lint -- 符合规范 --> SuccessE([Git Commit 成功])
        
        SuccessE --> Push[[Git Push 到远程]]
    end

    subgraph CICD [CI/CD 自动化发布]
        Push -- 触发 Workflow --> CI_Init[Checkout & 环境初始化]
        CI_Init --> ReleaseIt(Release-it 启动)
        
        ReleaseIt --> History{解析提交历史}
        History --> Bump[计算版本 & 更新 package.json]
        Bump --> Log[生成 CHANGELOG]
        
        Log --> GitOps[创建 Version Commit & Tag]
        GitOps --> Deploy[[发布到 NPM / GitHub]]
        Deploy --> Finish([发布完成])
    end

    %% 样式定义
    classDef highlight fill:#50fa7b,stroke:#50fa7b,color:#282a36;
    classDef critical fill:#ff5555,stroke:#ff5555,color:#ffffff;
    classDef logic fill:#f1fa8c,stroke:#f1fa8c,color:#282a36;
    classDef step fill:#6272a4,stroke:#f8f8f2,color:#f8f8f2;

    %% 应用样式
    class Start,SuccessE,Finish highlight;
    class FailD critical;
    class Lint,History logic;
    class Husky,Push,CI_Init,Bump,Log,GitOps,Deploy step;
{% endmermaid %}

## 六、总结

`release-it` 是一个值得在任何需要频繁发布和维护版本的项目中使用的工具。它将复杂的发布流程标准化、自动化，极大地提高了发布效率、减少了人为错误，并确保了版本历史的清晰和一致性。结合 `conventional-changelog` 和像 `Commitlint`、`Husky` 这样的代码规范工具，可以构建一个健壮且高效的自动化发布管道，让开发者能够专注于编写代码，而不是繁琐的发布操作。