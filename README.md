# <p align="center">🎙️ AI Podcast Generator 🚀✨</p>

<p align="center">The AI podcast generator uses large language models to generate conversation content by submitting various materials such as pictures, texts, links, and files, and it also supports the synthesis of background music to generate high-quality podcast audio.</p>

<p align="center"><a href="https://302.ai/en/tools/podcast/" target="blank"><img src="https://file.302ai.cn/gpt/imgs/github/302_badge.png" /></a></p >

<p align="center"><a href="README_zh.md">中文</a> | <a href="README.md">English</a> | <a href="README_ja.md">日本語</a></p>

![2. Adjust Content](docs/播客生成器en.png)

Open-source version of the [AI Podcast Generator](https://302.ai/tools/podcast/) from [302.AI](https://302.ai).
You can directly log in to 302.AI for a zero-code, zero-configuration online experience.
Alternatively, customize this project to suit your needs, integrate 302.AI's API KEY, and deploy it yourself.

## Interface Preview
Based on the content of the uploaded file, the AI will generate a podcast script. You can choose the number of people in the conversation, the output language and customize prompts.
![1. Select Materials](docs/播客英1.png)    

Once the complete podcast is generated, it can be downloaded, shared or regenerated.
![2. Adjust Content](docs/播客英2.png)

## Project Features
### 🎭 AI Role-playing
Create unique podcast host roles to give your program a distinctive personality.
### 📝 Intelligent Script Generation
Automatically generate structured podcast scripts based on your topics and keywords.
### ✏️ Real-time Editing
Adjust and modify the content at any time during the generation process. You can even use AI to assist you with the editing.
### 🗣️ Text-to-Speech
Convert the generated scripts into lifelike voices. Multiple voices and languages are available for selection, and you can even create your own exclusive voice.
### 🎶 Background Music and Sound Effects
Automatically add appropriate background music and sound effects to enhance the listener experience.
### 📜 History Record
Save your creation history so that nothing is forgotten, and you can download it anytime and anywhere.
### 🌐 Share Support
Share with one click to major social platforms.
### 🌓 Dark Mode
Support the dark mode to protect your eyes.
### 🌍 多言語サポート
- 中国語インターフェース
- 英語インターフェース
- 日本語インターフェース


With AI Podcast Generator, anyone can become a podcast creator! 🎉🎙️ Let's explore the new world of AI-driven podcasting together! 🌟🚀

## 🚩 Future Update Plans
- [ ] Optimize logical coherence
- [ ] Provide more detailed personalized style customization options, allowing users to precisely set the style tendency of the generated conversation content, so that the podcast can better match the preferences of the target audience and the brand image of the creator

## Tech Stack
- Next.js 14
- Tailwind CSS
- Shadcn UI
- Tiptap
- Vercel AI SDK
- Prisma
- MongoDB

## Development & Deployment
1. Clone the project: `git clone https://github.com/302ai/302_podcast_generator`
2. Install dependencies: `pnpm install`
3. Configure environment variables: Refer to .env.example
4. Run the project: `pnpm prisma generate && pnpm dev`
5. Build and deploy: `docker build -t podcast-generator . && docker run -p 3000:3000 podcast-generator`


## ✨ About 302.AI ✨
[302.AI](https://302.ai) is a pay-as-you-go AI application platform, bridging the gap between AI capabilities and practical implementation.
1. 🧠 Comprehensive AI capabilities: Incorporates the latest in language, image, audio, and video models from leading AI brands.
2. 🚀 Advanced application development: We build genuine AI products, not just simple chatbots.
3. 💰 No monthly fees: All features are pay-per-use, fully accessible, ensuring low entry barriers with high potential.
4. 🛠 Powerful admin dashboard: Designed for teams and SMEs - managed by one, used by many.
5. 🔗 API access for all AI features: All tools are open-source and customizable (in progress).
6. 💡 Powerful development team: Launching 2-3 new applications weekly with daily product updates. Interested developers are welcome to contact us.
