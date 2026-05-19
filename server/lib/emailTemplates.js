const templates = {
  'loan-fair': `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{brand_name}}</title>
<style>
  body { margin: 0; padding: 0; background: #f0f4f1; font-family: Arial, sans-serif; }
  .wrapper { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
  .header { background: #356852; border-radius: 8px 8px 0 0; padding: 32px; text-align: center; }
  .header h1 { margin: 0; color: white; font-size: 28px; letter-spacing: -0.5px; }
  .header p { margin: 8px 0 0; color: rgba(255,255,255,0.75); font-size: 14px; }
  .body { background: #ecdbba; border-radius: 0 0 8px 8px; padding: 32px; }
  .body p { color: #2d3b2d; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
  .cta { text-align: center; margin: 28px 0; }
  .cta a { background: #fbb040; color: #0f0f0f; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 700; font-size: 15px; display: inline-block; }
  .footer { text-align: center; padding: 20px 0 0; font-size: 12px; color: #6b6560; }
  .footer a { color: #356852; }
  @media (max-width: 480px) { .header, .body { padding: 20px; } }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>{{brand_name}}</h1>
    <p>Smart finance, made simple.</p>
  </div>
  <div class="body">
    <p>Hi {{first_name}},</p>
    <p>Write your message here. This is a great place to share news, offers, or updates with your customers.</p>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    <div class="cta">
      <a href="#">Get Started Today</a>
    </div>
    <p style="font-size:13px;color:#6b6560;">If you have any questions, simply reply to this email and we'll be happy to help.</p>
  </div>
  <div class="footer">
    <p>© {{brand_name}} · <a href="{{unsubscribe_url}}">Unsubscribe</a></p>
    <p style="margin-top:4px;color:#999;">You're receiving this because you enquired with {{brand_name}}.</p>
  </div>
</div>
</body>
</html>`,

  'klasp': `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{brand_name}}</title>
<style>
  body { margin: 0; padding: 0; background: #f5f7f5; font-family: Arial, sans-serif; }
  .wrapper { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
  .header { background: #2D5F4F; border-radius: 8px 8px 0 0; padding: 32px; }
  .header h1 { margin: 0; color: white; font-size: 26px; font-style: italic; letter-spacing: -0.5px; }
  .header p { margin: 8px 0 0; color: rgba(255,255,255,0.7); font-size: 14px; }
  .body { background: white; border-radius: 0 0 8px 8px; padding: 32px; border: 1px solid #e8eee8; border-top: none; }
  .body p { color: #1a1a1a; font-size: 15px; line-height: 1.65; margin: 0 0 16px; }
  .cta { text-align: center; margin: 28px 0; }
  .cta a { background: #2D5F4F; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 700; font-size: 15px; display: inline-block; }
  .footer { text-align: center; padding: 20px 0 0; font-size: 12px; color: #6b6560; }
  .footer a { color: #2D5F4F; }
  @media (max-width: 480px) { .header, .body { padding: 20px; } }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>{{brand_name}}</h1>
    <p>Finance that fits.</p>
  </div>
  <div class="body">
    <p>Hi {{first_name}},</p>
    <p>Write your message here. Share something valuable with your audience — an update, an offer, or helpful advice.</p>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco.</p>
    <div class="cta">
      <a href="#">Learn More</a>
    </div>
    <p style="font-size:13px;color:#6b6560;">Questions? Just reply to this email.</p>
  </div>
  <div class="footer">
    <p>© {{brand_name}} · <a href="{{unsubscribe_url}}">Unsubscribe</a></p>
  </div>
</div>
</body>
</html>`,

  'plain': `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{brand_name}}</title>
<style>
  body { margin: 0; padding: 0; background: #ffffff; font-family: Arial, sans-serif; }
  .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 24px; }
  .body p { color: #1a1a1a; font-size: 15px; line-height: 1.65; margin: 0 0 16px; }
  .cta { margin: 28px 0; }
  .cta a { background: #fbb040; color: #0f0f0f; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 700; font-size: 15px; display: inline-block; }
  hr { border: none; border-top: 1px solid #e5e5e5; margin: 28px 0; }
  .footer { font-size: 12px; color: #999; }
  .footer a { color: #666; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="body">
    <p>Hi {{first_name}},</p>
    <p>Write your message here.</p>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
    <div class="cta">
      <a href="#">Call to Action</a>
    </div>
  </div>
  <hr>
  <div class="footer">
    <p>© {{brand_name}} · <a href="{{unsubscribe_url}}">Unsubscribe</a></p>
  </div>
</div>
</body>
</html>`,
}

module.exports = { templates }
