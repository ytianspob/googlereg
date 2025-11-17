# Google Workspace子账号在线注册<br>Google Workspace sub-account online registration

A **Cloudflare Worker** project for online registration of Google Workspace sub-accounts.  
This project provides a web form for users to register new accounts under your domain, with optional auto-generated passwords and CAPTCHA verification via Cloudflare Turnstile.<br>
这是一个用于在线注册 Google Workspace 子帐户的 **Cloudflare Worker** 项目。
该项目提供一个网页表单，用户可以通过该表单在您的域名下注册新帐户，并可选择自动生成密码，以及通过 Cloudflare Turnstile 进行 CAPTCHA 验证。

---

## 功能Features

- 注册新的 Google Workspace 子帐户Register new Google Workspace sub-accounts
- 自动生成安全密码Auto-generate secure passwords
- 使用 Cloudflare Turnstile 进行 CAPTCHA 验证CAPTCHA verification with Cloudflare Turnstile
- 管理员密码验证，限制访问权限Admin password verification to restrict access
- 完全响应式 HTML 表单Fully responsive HTML form

---

## 前提条件Prerequisites

1. 已启用 Workers 的 **Cloudflare 帐户** **Cloudflare account** with Workers enabled
2. 包含 OAuth 凭据（客户端 ID、客户端密钥、刷新令牌）的 **Google Cloud 项目** **Google Cloud project** with OAuth credentials (Client ID, Client Secret, Refresh Token)
3. **Google Workspace 管理员帐户** **Google Workspace Admin account**
4. **Cloudflare Turnstile 站点密钥和密钥** **Cloudflare Turnstile site key and secret key**

---
