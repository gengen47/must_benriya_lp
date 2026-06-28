document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     1. Scroll Fade-in Animation (Intersection Observer)
     ========================================================================== */
  const fadeInUpElements = document.querySelectorAll('.fade-in-up');

  if ('IntersectionObserver' in window) {
    const observerOptions = {
      root: null, // viewport
      rootMargin: '0px 0px -100px 0px', // 少し手前でトリガーする
      threshold: 0.1 // 10%表示されたらトリガー
    };

    const fadeInUpObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // 一度表示されたら監視を終了する（スクロールを戻したときに消えないようにする）
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    fadeInUpElements.forEach(element => {
      fadeInUpObserver.observe(element);
    });
  } else {
    // 互換性対策：IntersectionObserverがサポートされていない場合は即座に表示
    fadeInUpElements.forEach(element => {
      element.classList.add('visible');
    });
  }


  /* ==========================================================================
     2. Sticky Header Offset Smooth Scrolling
     ========================================================================== */
  const header = document.getElementById('header');
  const scrollLinks = document.querySelectorAll('a[href^="#"]');

  scrollLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();

      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        // ヘッダーの高さを取得（固定ヘッダーのため）
        const headerHeight = header ? header.offsetHeight : 80;

        // ターゲット要素の位置を計算
        const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
        // ヘッダーの高さ分、上部に余白を空けてスクロール位置を調整
        const offsetPosition = elementPosition - headerHeight - 15; // 15pxの余白を追加

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });


  /* ==========================================================================
     3. FAQ Accordion Control
     ========================================================================== */
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');

    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // 他のすべてのアコーディオンを閉じる（1つだけ開く挙動にする）
      faqItems.forEach(otherItem => {
        otherItem.classList.remove('active');
      });

      // クリックされたものが非アクティブだった場合のみ開く
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });


  /* ==========================================================================
     4. Contact Form Validation & Submission Animation
     ========================================================================== */
  const contactForm = document.getElementById('contact-form');
  const formSuccessMessage = document.getElementById('form-success-message');
  const formSubmitBtn = document.getElementById('form-submit-btn');
  const formResetBtn = document.getElementById('form-reset-btn');

  const workAreaSelect = document.getElementById('work-area');
  const workAreaOtherGroup = document.getElementById('work-area-other-group');
  const workAreaOtherInput = document.getElementById('work-area-other');

  // 作業場所「その他」の動的制御
  if (workAreaSelect && workAreaOtherGroup && workAreaOtherInput) {
    workAreaSelect.addEventListener('change', function () {
      if (this.value === 'other') {
        workAreaOtherGroup.style.display = 'block';
        workAreaOtherInput.required = true;
      } else {
        workAreaOtherGroup.style.display = 'none';
        workAreaOtherInput.required = false;
        workAreaOtherInput.value = '';
      }
    });
  }

  if (contactForm && formSuccessMessage) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // 入力バリデーション
      const name = document.getElementById('name').value.trim();
      const tel = document.getElementById('tel').value.trim();
      const email = document.getElementById('email').value.trim();
      const serviceSelect = document.getElementById('service');
      const visitDate = document.getElementById('visit-date').value.trim();
      const message = document.getElementById('message').value.trim();

      if (!name || !tel || !email || !serviceSelect.value || !visitDate || !message) {
        alert('すべての必須項目を入力してください。');
        return;
      }

      // 簡単な電話番号形式チェック
      const telRegex = /^[0-9-]{10,13}$/;
      if (!telRegex.test(tel.replace(/\s+/g, ''))) {
        alert('正しい電話番号の形式で入力してください。');
        return;
      }

      // 送信中表示
      const originalBtnText = formSubmitBtn.textContent;
      formSubmitBtn.disabled = true;
      formSubmitBtn.textContent = '送信中...';

      // 送信データのシリアライズ
      const serviceText = serviceSelect.options[serviceSelect.selectedIndex].text;
      const finalWorkArea = workAreaSelect.value === 'other' ? workAreaOtherInput.value : workAreaSelect.value;

      const formData = new URLSearchParams();
      formData.append('type', 'submit_form'); // フォーム送信処理の識別用
      formData.append('name', name);
      formData.append('tel', tel);
      formData.append('email', email);
      formData.append('service', serviceText);
      formData.append('workArea', finalWorkArea);
      formData.append('visitDate', visitDate);
      formData.append('message', message);

      // GASのウェブアプリへPOST送信
      fetch(GOOGLE_CALENDAR_GAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      })
        .then(response => {
          if (!response.ok) throw new Error('送信エラー');
          return response.json();
        })
        .then(data => {
          if (data.status === 'success') {
            // フォーム非表示 ＆ 完了メッセージ表示
            contactForm.style.display = 'none';

            // 完了メッセージのフェードイン効果
            formSuccessMessage.style.display = 'block';
            formSuccessMessage.style.opacity = '0';
            formSuccessMessage.style.transform = 'translateY(10px)';
            formSuccessMessage.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

            // フォームパネルの上部へスムーズスクロール
            const formPanel = document.getElementById('form-panel');
            if (formPanel) {
              const headerHeight = header ? header.offsetHeight : 80;
              const elementPosition = formPanel.getBoundingClientRect().top + window.scrollY;
              window.scrollTo({
                top: elementPosition - headerHeight - 30,
                behavior: 'smooth'
              });
            }

            setTimeout(() => {
              formSuccessMessage.style.opacity = '1';
              formSuccessMessage.style.transform = 'translateY(0)';
            }, 50);
          } else {
            throw new Error(data.message || 'サーバー側での送信失敗');
          }
        })
        .catch(error => {
          console.error('Submit Error:', error);
          alert('送信中にエラーが発生しました。時間をおいて再度送信し直すか、お電話（090-2112-1080）にて直接お問い合わせください。');
        })
        .finally(() => {
          formSubmitBtn.disabled = false;
          formSubmitBtn.textContent = originalBtnText;
        });
    });

    // 送信完了メッセージからフォームへ戻る処理
    if (formResetBtn) {
      formResetBtn.addEventListener('click', () => {
        contactForm.reset();
        if (workAreaOtherGroup) {
          workAreaOtherGroup.style.display = 'none';
          workAreaOtherInput.required = false;
        }
        formSuccessMessage.style.display = 'none';
        contactForm.style.display = 'block';
      });
    }
  }

  /* ==========================================================================
     5. Reservation Calendar Control (予約状況カレンダー)
     ========================================================================== */
  // 【設定項目】Google Apps Script(GAS)で作成したウェブアプリのデプロイURLを設定してください。
  // 例: 'https://script.google.com/macros/s/XXXXXX/exec'
  const GOOGLE_CALENDAR_GAS_URL = 'https://script.google.com/macros/s/AKfycbx0nqIPuu7wyjiB_cH_OTok19hVm8yfJWaTvg6Cc7GnQ5rlZg4rdTp4i41bnPAOaOBu/exec';

  // 【設定項目】カレンダーの「○」「△」「×」を分ける基準時間（単位：時間）
  // 予定の合計がこの時間以上の日は「×（空きなし）」
  // それ未満でCALENDAR_LIMIT_WARN_HOURS以上の日は「△（残りわずか）」、それ未満の日は「○（空きあり）」になります。
  const CALENDAR_LIMIT_NG_HOURS = 8.0;
  const CALENDAR_LIMIT_WARN_HOURS = 3.0;

  const prevMonthBtn = document.getElementById('prev-month-btn');
  const nextMonthBtn = document.getElementById('next-month-btn');
  const calendarMonthTitle = document.getElementById('calendar-month-title');
  const calendarDaysContainer = document.getElementById('calendar-days');
  const visitDateInput = document.getElementById('visit-date');

  if (calendarDaysContainer && calendarMonthTitle && visitDateInput) {
    const today = new Date();
    let currentYear = today.getFullYear();
    let currentMonth = today.getMonth(); // 0-11

    // 表示可能な範囲（当月、翌月、翌々月の3ヶ月間）
    const minYear = today.getFullYear();
    const minMonth = today.getMonth();
    const maxDate = new Date(today.getFullYear(), today.getMonth() + 2, 1);
    const maxYear = maxDate.getFullYear();
    const maxMonth = maxDate.getMonth();

    // 曜日名の配列
    const weekDaysJa = ['日', '月', '火', '水', '木', '金', '土'];

    // Googleカレンダー（GAS経由）から取得した「予定あり（予約不可）」の日付を記録するオブジェクト
    let blockedDates = {};

    // GASのウェブアプリから予約データを取得する非同期関数
    const fetchCalendarData = async () => {
      if (!GOOGLE_CALENDAR_GAS_URL) {
        console.log('GASのURLが未設定のため、デモデータを使用します。');
        return;
      }
      try {
        const response = await fetch(GOOGLE_CALENDAR_GAS_URL);
        if (!response.ok) throw new Error('ネットワークエラー');
        const data = await response.json();
        // dataは {"2026-06-28": 4.5} 形式のJSON（各日の合計予定時間）
        blockedDates = data;
      } catch (error) {
        console.warn('Googleカレンダーからのデータ取得に失敗しました。デモデータを表示します。:', error);
      }
    };

    // 日付ごとの予約状況を取得する関数
    const getReservationStatus = (year, month, day) => {
      const date = new Date(year, month, day);

      // 過去の日付は一律非活性
      const compareToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (date < compareToday) {
        return 'disabled';
      }

      // YYYY-MM-DD 形式のキーを作成
      const y = year;
      const m = String(month + 1).padStart(2, '0');
      const d = String(day).padStart(2, '0');
      const dateKey = `${y}-${m}-${d}`;

      // GAS経由でGoogleカレンダー（TimeTree）から取得したその日の合計予定時間（時間数）
      const totalHours = blockedDates[dateKey] || 0.0;

      if (totalHours >= CALENDAR_LIMIT_NG_HOURS) {
        return 'ng'; // × (空きなし)
      } else if (totalHours >= CALENDAR_LIMIT_WARN_HOURS) {
        return 'warn'; // △ (残りわずか)
      }

      // 予定の合計が3時間未満の日は一律「○：空きあり」
      return 'ok';
    };

    const renderCalendar = (year, month) => {
      // タイトル更新
      calendarMonthTitle.textContent = `${year}年${month + 1}月`;

      // 日のクリア
      calendarDaysContainer.innerHTML = '';

      // 月の初日
      const firstDayIndex = new Date(year, month, 1).getDay();
      // 月の最終日
      const lastDay = new Date(year, month + 1, 0).getDate();

      // 前月の空白セル
      for (let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('calendar-day-cell', 'day-disabled');
        calendarDaysContainer.appendChild(emptyCell);
      }

      // 当月の日セル
      for (let day = 1; day <= lastDay; day++) {
        const cell = document.createElement('div');
        cell.classList.add('calendar-day-cell');

        // 日付数値
        const numSpan = document.createElement('span');
        numSpan.classList.add('calendar-day-num');
        numSpan.textContent = day;
        cell.appendChild(numSpan);

        // 曜日判定
        const dateObj = new Date(year, month, day);
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek === 0) cell.classList.add('day-sunday');
        if (dayOfWeek === 6) cell.classList.add('day-saturday');

        // 予約ステータス判定
        const status = getReservationStatus(year, month, day);

        const statusSpan = document.createElement('span');
        statusSpan.classList.add('calendar-day-status');

        if (status === 'disabled') {
          cell.classList.add('day-disabled');
          statusSpan.textContent = '-';
        } else if (status === 'ng') {
          cell.classList.add('day-ng');
          statusSpan.textContent = '×';
        } else if (status === 'warn') {
          cell.classList.add('day-warn');
          statusSpan.textContent = '△';
          setupClickEvent(cell, year, month, day, dayOfWeek);
        } else if (status === 'ok') {
          cell.classList.add('day-ok');
          statusSpan.textContent = '○';
          setupClickEvent(cell, year, month, day, dayOfWeek);
        }

        cell.appendChild(statusSpan);

        // すでに入力欄にこの日付が入っている場合は selected にする
        const formattedDate = `${year}年${month + 1}月${day}日(${weekDaysJa[dayOfWeek]})`;
        if (visitDateInput.value === formattedDate) {
          cell.classList.add('selected');
        }

        calendarDaysContainer.appendChild(cell);
      }

      // ナビゲーションボタンの活性・非活性制御
      if (year === minYear && month === minMonth) {
        prevMonthBtn.disabled = true;
      } else {
        prevMonthBtn.disabled = false;
      }

      if (year === maxYear && month === maxMonth) {
        nextMonthBtn.disabled = true;
      } else {
        nextMonthBtn.disabled = false;
      }
    };

    const setupClickEvent = (element, year, month, day, dayOfWeek) => {
      element.addEventListener('click', () => {
        // すべての選択状態を解除
        const selectedCells = calendarDaysContainer.querySelectorAll('.calendar-day-cell.selected');
        selectedCells.forEach(c => c.classList.remove('selected'));

        // 今回のセルを選択状態にする
        element.classList.add('selected');

        // インプットに反映
        const dateStr = `${year}年${month + 1}月${day}日(${weekDaysJa[dayOfWeek]})`;
        visitDateInput.value = dateStr;
      });
    };

    // GASからデータを読み込んだ後にカレンダーを初期描画
    fetchCalendarData().then(() => {
      renderCalendar(currentYear, currentMonth);
    });

    // 前月へ
    prevMonthBtn.addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar(currentYear, currentMonth);
    });

    // 翌月へ
    nextMonthBtn.addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar(currentYear, currentMonth);
    });

    // インプット欄クリック時にもカレンダー位置にスクロールさせる
    visitDateInput.addEventListener('click', () => {
      const container = document.querySelector('.reservation-calendar-container');
      if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

});
