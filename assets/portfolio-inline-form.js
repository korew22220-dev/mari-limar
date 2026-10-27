/* Shared inline component: topic and context may be supplied by the page. */
(() => {
  'use strict';
  const form = document.getElementById('pf-request-form');
  const api = window.MariLead;
  if (!form || !api) return;
  const fields = form.elements;
  const ready = document.getElementById('pf-request-ready');
  const message = document.getElementById('pf-request-message');
  const phoneError = document.getElementById('pf-request-phone-error');
  const channelHint = document.getElementById('pf-request-hint');
  const copyStatus = document.getElementById('pf-request-copy-status');
  const chat = document.getElementById('pf-request-chat');
  document.getElementById('pf-request-fields').disabled = false;
  fields.namedItem('name').addEventListener('input', () => fields.namedItem('name').setCustomValidity(''));
  fields.namedItem('phone').addEventListener('input', () => {
    fields.namedItem('phone').setCustomValidity('');
    fields.namedItem('phone').removeAttribute('aria-invalid');
    phoneError.textContent = '';
  });
  fields.namedItem('channel').addEventListener('change', () => {
    channelHint.textContent = fields.namedItem('channel').value === 'telegram'
      ? 'Для Telegram скопируйте готовый текст и вставьте его в чат студии.'
      : 'В WhatsApp текст подставится автоматически. Вы отправите его сами.';
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const name = fields.namedItem('name'), phone = fields.namedItem('phone');
    name.setCustomValidity(name.value.trim() ? '' : 'Укажите ваше имя.');
    if (!name.reportValidity()) return;
    const error = api.phoneError(phone.value);
    phone.setCustomValidity(error);
    phoneError.textContent = error;
    if (error) { phone.setAttribute('aria-invalid', 'true'); phone.reportValidity(); phone.focus(); return; }
    if (!form.reportValidity()) return;
    message.value = api.formatEnquiry({name:name.value, phone:phone.value, comment:fields.namedItem('comment').value, topic:form.dataset.leadTopic || 'project', context:form.dataset.leadContext || 'Портфолио — обсуждение проекта', model:'', source:location.origin + location.pathname});
    const links = api.messageLinks(message.value);
    const telegram = fields.namedItem('channel').value === 'telegram';
    chat.href = telegram ? links.telegram : links.whatsapp;
    chat.textContent = telegram ? 'Открыть Telegram' : 'Открыть WhatsApp';
    document.getElementById('pf-request-ready-hint').textContent = telegram
      ? 'Скопируйте текст, откройте Telegram и отправьте его в чат студии.'
      : 'Откройте WhatsApp и отправьте подготовленное сообщение в чат студии.';
    form.hidden = true;
    ready.hidden = false;
    copyStatus.textContent = '';
    document.getElementById('pf-request-ready-title').focus({preventScroll:true});
  });
  document.getElementById('pf-request-edit').addEventListener('click', () => {
    ready.hidden = true; form.hidden = false; fields.namedItem('name').focus({preventScroll:true});
  });
  document.getElementById('pf-request-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(message.value);
      copyStatus.textContent = 'Текст скопирован. Вставьте его в чат.';
    } catch (_) {
      message.focus(); message.select();
      copyStatus.textContent = 'Выделенный текст можно скопировать вручную.';
    }
  });
})();

