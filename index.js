// Cloudflare Worker version

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env)
  }
}

function generateRandomPassword() {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

async function handleRequest(request, env) {
  if (request.method === 'GET') {
    return serveRegistrationForm(env);
  } else if (request.method === 'POST') {
    return handleRegistration(request, env);
  } else {
    return new Response('Method Not Allowed', { status: 405 });
  }
}

function serveRegistrationForm(env) {
  const emailDomain = env.EMAIL_DOMAIN || '@xxx.xxx';
  const TURNSTILE_SITE_KEY = env.TURNSTILE_SITE_KEY;
  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>XXX 邮箱注册/XXX Email Registration</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f7f7; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        .container { background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); max-width: 400px; width: 100%; box-sizing: border-box; }
        h2 { text-align: center; color: #333; font-size: 24px; margin-bottom: 20px; }
        form { display: flex; flex-direction: column; }
        label { font-size: 14px; color: #555; margin-bottom: 6px; }
        input[type="text"], input[type="email"], input[type="password"] { width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; transition: border 0.3s ease; }
        input[type="text"]:focus, input[type="email"]:focus, input[type="password"]:focus { border-color: #4CAF50; outline: none; }
        input[type="submit"] { width: 100%; padding: 12px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-top: 15px; transition: background-color 0.3s ease; }
        input[type="submit"]:hover { background-color: #45a049; }
        small { font-size: 12px; color: #777; }
        .footer { text-align: center; font-size: 14px; padding-top: 20px; color: #888; }
        .footer a { color: #4CAF50; text-decoration: none; }
        .footer a:hover { text-decoration: underline; }
        .password-options { display: flex; align-items: center; gap: 8px; margin-top: 8px; margin-bottom: 8px; }
        .password-options label { margin-bottom: 0; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>XXX 邮箱注册/XXX Email Registration</h2>
        <form method="POST">
          <label for="firstName">名字:/Firstname:</label>
          <input type="text" id="firstName" name="firstName" required oninput="updateUsername()">

          <label for="lastName">姓氏:/Lastname:</label>
          <input type="text" id="lastName" name="lastName" required oninput="updateUsername()">

          <label for="username">用户名:/Username:</label>
          <input type="text" id="username" name="username" required>
          <small>邮箱后缀将自动添加为/The email suffix will be added automatically as <strong>${escapeHtml(emailDomain)}</strong></small><br><br>

          <label for="password">密码:/Password</label>
          <input type="password" id="password" name="password">

          <div class="password-options">
            <label for="generatePassword">自动生成密码:/Generate Password Automatically</label>
            <input type="checkbox" id="generatePassword" name="generatePassword">
          </div><br>

          <label for="verificationCode">管理员密码:/Admin Password</label>
          <input type="text" id="verificationCode" name="verificationCode" required>

          <div class="cf-turnstile" data-sitekey="${TURNSTILE_SITE_KEY}"></div>

          <input type="submit" value="注册/Register">
        </form>
        <div class="footer">
          <p>官网/Website: <a href="https:/xxx.xxx/" target="_blank">https://xxx.xxx/</a></p>
        </div>
        <script>
          function updateUsername() {
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const username = document.getElementById('username');
            username.value = firstName.toLowerCase() + '.' + lastName.toLowerCase();
          }
        </script>
      </div>
    </body>
  </html>`

  return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

async function handleRegistration(request, env) {
  const formData = await request.formData();
  const firstName = formData.get('firstName');
  const lastName = formData.get('lastName');
  const username = formData.get('username');
  const password = formData.get('password');
  const verificationCode = formData.get('verificationCode');
  const captchaToken = formData.get('cf-turnstile-response');
  const generatePassword = formData.get('generatePassword') === 'on';

  const isHuman = await verifyTurnstile(captchaToken, env);
  if (!isHuman) return new Response('图形验证码校验失败，请重试。/Captcha check failed. Try again.', { status: 400 });

  if (!firstName || !lastName || !username || !verificationCode) {
    return new Response('所有字段都是必填的。/All fields must be filled in.', { status: 400 });
  }

  if (!generatePassword && !password) {
    return new Response('请填写密码，或勾选自动生成密码。/Please enter a password, or select auto-generate password.', { status: 400 });
  }

  if (verificationCode !== env.VERIFICATION_CODE) {
    return new Response('管理员密码错误。/Admin password incorrect.', { status: 400 });
  }

  const email = `${username}${env.EMAIL_DOMAIN}`;
  const finalPassword = generatePassword ? generateRandomPassword() : password;

  try {
    const accessToken = await getAccessToken(env);
    const user = {
      name: { givenName: firstName, familyName: lastName },
      password: finalPassword,
      primaryEmail: email,
      changePasswordAtNextLogin: true
    };

    const response = await fetch('https://admin.googleapis.com/admin/directory/v1/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });

    if (response.ok) {
      return new Response(`<html><body><h2>注册成功！/Registration successful!</h2><p>邮箱:/Email:<strong>${escapeHtml(email)}</strong></p><p><strong>密码:/Password:</strong>${escapeHtml(finalPassword)}</p><p>谷歌邮箱登入:/Login:mail.google.com</p><button onclick="window.location.href='/'">返回首页/Return to Home</button></body></html>`, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    } else {
      const error = await response.json();
      return new Response(`注册失败:/Registration failed: ${error.error.message}`, { status: 500 });
    }
  } catch (error) {
    return new Response(`内部错误:/Internal Error: ${error.message}`, { status: 500 });
  }
}

async function getAccessToken(env) {
  const tokenEndpoint = 'https://oauth2.googleapis.com/token';
  const params = new URLSearchParams();
  params.append('client_id', env.CLIENT_ID);
  params.append('client_secret', env.CLIENT_SECRET);
  params.append('refresh_token', env.REFRESH_TOKEN);
  params.append('grant_type', 'refresh_token');

  const tokenResponse = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`无法获取访问令牌:/Unable to obtain access token: ${error}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function verifyTurnstile(token, env) {
  const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  const params = new URLSearchParams();
  params.append('secret', env.TURNSTILE_SECRET_KEY);
  params.append('response', token);

  const response = await fetch(url, {
    method: 'POST',
    body: params,
  });

  const data = await response.json();
  return data.success;
}
