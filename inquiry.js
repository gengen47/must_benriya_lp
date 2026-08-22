const GAS_URL = 'https://script.google.com/macros/s/AKfycbzRhAxvvITrQRVf4EWfqnLCnHzMfhQma66S81NX0PpZcBx3GoAYwCoQer4eqnO1ORkp/exec';
const LIMIT_FULL = 8;
const LIMIT_WARN = 3;

export async function initInquiry() {
  let inquiry = document.querySelector('#inquiry');
  if (!inquiry) {
    const contact = document.querySelector('.contact');
    if (!contact) return;
    try {
      const response = await fetch('inquiry-form.html');
      if (!response.ok) throw new Error('form template');
      contact.insertAdjacentHTML('afterend', await response.text());
      inquiry = document.querySelector('#inquiry');
    } catch (error) {
      console.error('Inquiry form could not be loaded.', error);
      return;
    }
  }
  try {
    setupAreaField();
    setupCalendar();
    setupForm();
    setupServiceLinks();
    setupInquiryJumps();
  } catch (error) {
    console.error('Inquiry form could not be initialized.', error);
  }
}

function setupServiceLinks() {
  const select = document.querySelector('#service');
  const inquiry = document.querySelector('#inquiry');
  if (!select || !inquiry) return;
  document.querySelectorAll('.service-row[data-service]').forEach(link => {
    link.addEventListener('click', event => {
      const value = link.dataset.service;
      if (![...select.options].some(option => option.value === value)) return;
      event.preventDefault();
      select.value = value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      scrollToInquiry(inquiry);
    });
  });
}

function setupInquiryJumps() {
  const inquiry = document.querySelector('#inquiry');
  if (!inquiry) return;
  document.querySelectorAll('.inquiry-jump').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      scrollToInquiry(inquiry);
    });
  });
  if (location.hash === '#inquiry') requestAnimationFrame(() => scrollToInquiry(inquiry));
}

function scrollToInquiry(inquiry) {
  history.replaceState(null, '', '#inquiry');
  inquiry.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

function setupAreaField() {
  const select = document.querySelector('#work-area');
  const group = document.querySelector('#work-area-other-group');
  const input = document.querySelector('#work-area-other');
  if (!select || !group || !input) return;
  const missingAreas = ['秦野市','厚木市','大和市','伊勢原市','海老名市','座間市','南足柄市','綾瀬市','葉山町','寒川町','大磯町','二宮町','中井町','大井町','松田町','山北町','開成町','箱根町','真鶴町','湯河原町','愛川町','清川村'];
  const other = select.querySelector('option[value="other"]');
  missingAreas.forEach(area => {
    if ([...select.options].some(option => option.value === area)) return;
    const option = new Option(area, area);
    select.insertBefore(option, other);
  });
  select.addEventListener('change', () => {
    const isOther = select.value === 'other';
    group.hidden = !isOther;
    input.required = isOther;
    if (!isOther) input.value = '';
  });
}

function setupCalendar() {
  const days = document.querySelector('#calendar-days');
  const title = document.querySelector('#calendar-title');
  const input = document.querySelector('#visit-date');
  const prev = document.querySelector('#prev-month');
  const next = document.querySelector('#next-month');
  const status = document.querySelector('#calendar-status');
  if (!days || !title || !input || !prev || !next) return;
  const today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth();
  let schedule = {};

  const render = () => renderCalendar({ days, title, input, prev, next, today, year, month, schedule });
  prev.addEventListener('click', () => { month -= 1; if (month < 0) { month = 11; year -= 1; } render(); });
  next.addEventListener('click', () => { month += 1; if (month > 11) { month = 0; year += 1; } render(); });
  render();
  fetch(GAS_URL).then(response => {
    if (!response.ok) throw new Error('calendar response');
    return response.json();
  }).then(data => {
    schedule = data && typeof data === 'object' ? data : {};
    if (status) status.textContent = '最新の予約状況です';
    render();
  }).catch(() => {
    if (status) status.textContent = '予約状況を取得できませんでした。選択後、担当者が日程を確認します。';
    render();
  });
}

function renderCalendar(state) {
  const { days, title, input, prev, next, today, year, month, schedule } = state;
  const min = new Date(today.getFullYear(), today.getMonth(), 1);
  const max = new Date(today.getFullYear(), today.getMonth() + 2, 1);
  const current = new Date(year, month, 1);
  title.textContent = `${year}年 ${month + 1}月`;
  days.replaceChildren();
  for (let blank = 0; blank < current.getDay(); blank += 1) days.append(createCalendarCell('blank'));
  const last = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= last; day += 1) {
    const date = new Date(year, month, day);
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hours = Number(schedule[key] || 0);
    const past = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const type = past ? 'disabled' : hours >= LIMIT_FULL ? 'full' : hours >= LIMIT_WARN ? 'warn' : 'open';
    const cell = createCalendarCell(type, day);
    if (!past && type !== 'full') {
      cell.type = 'button';
      cell.setAttribute('aria-label', `${month + 1}月${day}日 ${type === 'warn' ? '残りわずか' : '空きあり'}`);
      cell.addEventListener('click', () => {
        days.querySelectorAll('.selected').forEach(item => item.classList.remove('selected'));
        cell.classList.add('selected');
        const weekdays = ['日','月','火','水','木','金','土'];
        input.value = `${year}年${month + 1}月${day}日(${weekdays[date.getDay()]})`;
        input.dispatchEvent(new Event('change'));
      });
    }
    days.append(cell);
  }
  prev.disabled = current <= min;
  next.disabled = current >= max;
}

function createCalendarCell(type, day = '') {
  const cell = document.createElement(type === 'open' || type === 'warn' ? 'button' : 'span');
  cell.className = `calendar-day ${type}`;
  if (day) cell.innerHTML = `<b>${day}</b><i>${type === 'open' ? '○' : type === 'warn' ? '△' : type === 'full' ? '×' : '−'}</i>`;
  return cell;
}

function setupForm() {
  const form = document.querySelector('#contact-form');
  const submit = document.querySelector('#form-submit');
  const success = document.querySelector('#form-success');
  const failure = document.querySelector('#form-failure');
  if (!form || !submit || !success || !failure) return;
  form.querySelectorAll('input,select,textarea').forEach(control => {
    control.addEventListener('input', () => clearError(control));
    control.addEventListener('change', () => clearError(control));
  });
  document.querySelector('#form-reset')?.addEventListener('click', () => {
    form.reset(); success.hidden = true; form.hidden = false;
  });
  document.querySelector('#form-retry')?.addEventListener('click', () => {
    failure.hidden = true; form.hidden = false;
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!validateForm(form)) return;
    submit.disabled = true;
    submit.classList.add('loading');
    submit.querySelector('span').textContent = '送信しています';
    try {
      const response = await fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: buildPayload(form) });
      if (!response.ok) throw new Error('submit response');
      const data = await response.json();
      if (data.status !== 'success') throw new Error(data.message || 'submit result');
      form.hidden = true; success.hidden = false;
      success.focus?.();
    } catch (error) {
      console.error('Inquiry submission failed.', error);
      form.hidden = true; failure.hidden = false;
    } finally {
      submit.disabled = false;
      submit.classList.remove('loading');
      submit.querySelector('span').textContent = 'この内容で無料見積もりを申し込む';
    }
  });
}

function validateForm(form) {
  form.querySelectorAll('.field-error').forEach(item => { item.textContent = ''; });
  form.querySelectorAll('[aria-invalid="true"]').forEach(item => item.removeAttribute('aria-invalid'));
  const required = ['name','tel','email','service','work-area','visit-date','message','privacy-consent'];
  if (form.elements['work-area'].value === 'other') required.push('work-area-other');
  let firstInvalid = null;
  required.forEach(id => {
    const control = document.getElementById(id);
    const empty = control.type === 'checkbox' ? !control.checked : !control.value.trim();
    let message = empty ? '入力してください。' : '';
    if (!message && id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(control.value)) message = 'メールアドレスの形式を確認してください。';
    if (!message && id === 'tel' && !/^[0-9+()\-\s]{10,18}$/.test(control.value)) message = '電話番号の形式を確認してください。';
    if (message) {
      control.setAttribute('aria-invalid', 'true');
      const error = document.getElementById(`${id}-error`);
      if (error) error.textContent = message;
      if (!firstInvalid) firstInvalid = control;
    }
  });
  if (firstInvalid) { firstInvalid.focus(); firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' }); return false; }
  return true;
}

function clearError(control) {
  control.removeAttribute('aria-invalid');
  const error = document.getElementById(`${control.id}-error`);
  if (error) error.textContent = '';
}

function buildPayload(form) {
  const service = form.elements.service;
  const area = form.elements['work-area'];
  const params = new URLSearchParams();
  params.set('type', 'submit_form');
  params.set('name', form.elements.name.value.trim());
  params.set('tel', form.elements.tel.value.trim());
  params.set('email', form.elements.email.value.trim());
  params.set('service', service.options[service.selectedIndex].text);
  params.set('workArea', area.value === 'other' ? form.elements['work-area-other'].value.trim() : area.value);
  params.set('visitDate', form.elements['visit-date'].value);
  params.set('message', form.elements.message.value.trim());
  return params.toString();
}
