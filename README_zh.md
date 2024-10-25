# 🎙️🤖 欢迎来到302.AI的AI播客生成器! 🚀✨

[中文](README_zh.md) | [English](README.md) | [日本語](README_ja.md)

来自[302.AI](https://302.ai)的[AI播客生成器](https://302.ai/tools/podcast/)的开源版本。
你可以直接登录302.AI，零代码零配置使用在线版本。
或者对本项目根据自己的需求进行修改，传入302.AI的API KEY，自行部署。

## ✨ 302.AI介绍 ✨ 
[302.AI](https://302.ai)是一个按需付费的AI应用平台，为用户解决AI用于实践的最后一公里问题。
1. 🧠 集合了最新最全的AI能力和品牌，包括但不限于语言模型、图像模型、声音模型、视频模型。
2. 🚀 在基础模型上进行深度应用开发，我们开发真正的AI产品，而不是简单的对话机器人
3. 💰 零月费，所有功能按需付费，全面开放，做到真正的门槛低，上限高。
4. 🛠 功能强大的管理后台，面向团队和中小企业，一人管理，多人使用。
5. 🔗 所有AI能力均提供API接入，所有工具开源可自行定制（进行中）。
6. 💡 强大的开发团队，每周推出2-3个新应用，产品每日更新。有兴趣加入的开发者也欢迎联系我们

## 项目特性
1. 🎭 AI角色扮演: 创建独特的播客主持人角色,赋予您的节目独特的个性。
2. 📝 智能脚本生成: 基于您的主题和关键词,自动生成结构化的播客脚本。
3. ✏️ 实时编辑: 在生成过程中随时调整和修改内容,甚至可以使用AI来帮助您编辑。
4. 🗣️ 文本转语音: 将生成的脚本转换为逼真的语音,多种声音和语言可选，甚至可以制作您的专属声音。
5. 🎶 背景音乐和音效: 自动添加合适的背景音乐和音效,增强听众体验。
6. 📜 历史记录: 保存您的创作历史,记忆不丢失，随时随地都可以下载。
7. 🌐 支持分享: 一键分享到各大社交平台。
8. 🌓 暗色模式: 支持暗色模式，保护您的眼睛。
9. 🌐 国际化: 支持多语言，目前支持中文、英文和日文。

通过Ai播客生成器,任何人都可以成为播客创作者! 🎉🎙️ 让我们一起探索AI驱动的播客新世界吧! 🌟🚀

## 技术栈
- Next.js 14
- Tailwind CSS
- Shadcn UI
- Tiptap
- Vecel AI SDK
- Prisma
- MongoDB

## 开发&部署
1. 克隆项目 `git clone https://github.com/302ai/pub_podcast_generator`
2. 安装依赖 `pnpm install`
3. 配置302的API KEY 参考.env.example
4. 运行项目 `pnpm prisma generate && pnpm dev`
5. 打包部署 `docker build -t podcast-generator . && docker run -p 3000:3000 podcast-generator`

## 界面预览

### 1、选择素材
![一、选择素材](docs/one.png)
![一、选择素材-暗色](docs/one_dark.png)
### 2、调整内容
![二、调整内容](docs/two.png)
![二、调整内容-暗色](docs/two_dark.png)
### 3、配置声音
![三、配置声音](docs/three.png)
![三、配置声音-暗色](docs/three_dark.png)
### 4、生成播客
![四、生成播客](docs/four.png)
![四、生成播客-暗色](docs/four_dark.png)