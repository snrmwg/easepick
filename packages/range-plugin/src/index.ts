import { DateTime } from '@easepick/datetime';
import { BasePlugin, IEventDetail, IPlugin } from '@easepick/base-plugin';
import { IRangeConfig } from './interface';
import './index.scss';

export class RangePlugin extends BasePlugin implements IPlugin {
  public tooltipElement: HTMLElement;
  public triggerElement: HTMLElement;

  public binds = {
    setStartDate: this.setStartDate.bind(this),
    setEndDate: this.setEndDate.bind(this),
    setDateRange: this.setDateRange.bind(this),
    getStartDate: this.getStartDate.bind(this),
    getEndDate: this.getEndDate.bind(this),
    onView: this.onView.bind(this),
    onShow: this.onShow.bind(this),
    onMouseEnter: this.onMouseEnter.bind(this),
    onMouseLeave: this.onMouseLeave.bind(this),
    onClick: this.onClick.bind(this),
  };

  public options: IRangeConfig = {
    elementEnd: null,
    startDate: null,
    endDate: null,
    repick: false,
    strict: true,
    delimiter: ' - ',
    tooltip: true,
    tooltipNumber: (num: number) => {
      return num;
    },
    locale: {
      one: 'day',
      other: 'days',
    },
    documentClick: this.hidePicker.bind(this),
  };

  /**
   * Returns plugin name
   * 
   * @returns String
   */
  public getName(): string {
    return 'RangePlugin';
  }

  /**
   * - Called automatically via BasePlugin.attach() -
   * The function execute on initialize the picker
   */
  public onAttach(): void {
    this.binds['_setStartDate'] = this.picker.setStartDate;
    this.binds['_setEndDate'] = this.picker.setEndDate;
    this.binds['_setDateRange'] = this.picker.setDateRange;
    this.binds['_getStartDate'] = this.picker.getStartDate;
    this.binds['_getEndDate'] = this.picker.getEndDate;

    Object.defineProperties(this.picker, {
      setStartDate: {
        configurable: true,
        value: this.binds.setStartDate,
      },
      setEndDate: {
        configurable: true,
        value: this.binds.setEndDate,
      },
      setDateRange: {
        configurable: true,
        value: this.binds.setDateRange,
      },
      getStartDate: {
        configurable: true,
        value: this.binds.getStartDate,
      },
      getEndDate: {
        configurable: true,
        value: this.binds.getEndDate,
      },
    });

    if (this.options.elementEnd) {
      if (!(this.options.elementEnd instanceof HTMLElement)) {
        this.options.elementEnd = this.picker
          .options
          .doc.querySelector(this.options.elementEnd) as HTMLElement;
      }

      if (this.options.elementEnd instanceof HTMLInputElement) {
        this.options.elementEnd.readOnly = this.picker.options.readonly;
      }

      if (typeof this.picker.options.documentClick === 'function') {
        document.removeEventListener('click', this.picker.options.documentClick, true);

        if (typeof this.options.documentClick === 'function') {
          document.addEventListener('click', this.options.documentClick, true);
        }
      }

      (this.options.elementEnd as HTMLElement).addEventListener('click', this.picker.show.bind(this.picker));
    }

    this.options.repick = this.options.repick && this.options.elementEnd instanceof HTMLElement;

    this.picker.options.date = null;

    this.picker.on('view', this.binds.onView);
    this.picker.on('show', this.binds.onShow);
    this.picker.on('mouseenter', this.binds.onMouseEnter, true);
    this.picker.on('mouseleave', this.binds.onMouseLeave, true);
    this.picker.on('click', this.binds.onClick, true);

    this.checkIntlPluralLocales();
  }

  /**
   * - Called automatically via BasePlugin.detach() -
   */
  public onDetach(): void {
    Object.defineProperties(this.picker, {
      setStartDate: {
        configurable: true,
        value: this.binds['_setStartDate'],
      },
      setEndDate: {
        configurable: true,
        value: this.binds['_setEndDate'],
      },
      setDateRange: {
        configurable: true,
        value: this.binds['_setDateRange'],
      },
      getStartDate: {
        configurable: true,
        value: this.binds['_getStartDate'],
      },
      getEndDate: {
        configurable: true,
        value: this.binds['_getEndDate'],
      },
    });

    this.picker.off('view', this.binds.onView);
    this.picker.off('show', this.binds.onShow);
    this.picker.off('mouseenter', this.binds.onMouseEnter, true);
    this.picker.off('mouseleave', this.binds.onMouseLeave, true);
    this.picker.off('click', this.binds.onClick, true);
  }

  /**
   * Function `show` event
   * 
   * @param event 
   */
  private onShow(event) {
    const { target }: IEventDetail = event.detail;
    this.triggerElement = target;

    this.initializeRepick();
  }

  /**
   * Function `view` event
   * Adds HTML layout of current plugin to the picker layout
   * 
   * @param event 
   */
  private onView(event: CustomEvent) {
    const { view, target }: IEventDetail = event.detail;

    if (view === 'Main') {
      this.tooltipElement = document.createElement('span');
      this.tooltipElement.className = 'range-plugin-tooltip';
      target.appendChild(this.tooltipElement);
    }

    if (view === 'CalendarDay') {
      const date = new DateTime(target.dataset.time);
      const datePicked = this.picker.datePicked;
      const start = datePicked.length ? this.picker.datePicked[0] : this.getStartDate();
      const end = datePicked.length ? this.picker.datePicked[1] : this.getEndDate();

      if (start && start.isSame(date, 'day')) {
        target.classList.add('start');
      }

      if (start && end) {
        if (end.isSame(date, 'day')) {
          target.classList.add('end');
        }

        if (date.isBetween(start, end)) {
          target.classList.add('in-range');
        }
      }
    }
  }

  /**
   * Function for documentClick option
   * Allows the picker to close when the user clicks outside
   * 
   * @param e 
   */
  private hidePicker(e) {
    let target = e.target;
    let host = null;

    if (target.shadowRoot) {
      target = e.composedPath()[0];
      host = target.getRootNode().host;
    }

    if (this.picker.isShown()
      && host !== this.picker.ui.wrapper
      && target !== this.picker.options.element
      && target !== this.options.elementEnd) {
      this.picker.hide();
    }
  }

  /**
   * Set startDate programmatically
   * 
   * @param date 
   */
  private setStartDate(date: Date | string | number) {
    const d = new DateTime(date, this.picker.options.format);
    this.options.startDate = d ? d.clone() : null;

    this.assignDates();

    this.picker.renderAll();
  }

  /**
   * Set endDate programmatically
   * 
   * @param date 
   */
  private setEndDate(date: Date | string | number) {
    const d = new DateTime(date, this.picker.options.format);
    this.options.endDate = d ? d.clone() : null;

    this.assignDates();

    this.picker.renderAll();
  }

  /**
   * Set date range programmatically
   * 
   * @param start 
   * @param end 
   */
  private setDateRange(start: Date | string | number, end: Date | string | number) {
    const startDate = new DateTime(start, this.picker.options.format);
    const endDate = new DateTime(end, this.picker.options.format);

    this.options.startDate = startDate ? startDate.clone() : null;
    this.options.endDate = endDate ? endDate.clone() : null;

    this.assignDates();

    this.picker.renderAll();
  }

  /**
   * Displays startDate and endDate in input.value
   */
  private assignDates() {
    const el = this.picker.options.element;
    const elEnd = this.options.elementEnd;
    const start = this.picker.getStartDate();
    const end = this.picker.getEndDate();
    const startString = start
      ? start.format(this.picker.options.format, this.picker.options.lang)
      : '...';
    const endString = end
      ? end.format(this.picker.options.format, this.picker.options.lang)
      : '...';

    if (elEnd) {
      if (el instanceof HTMLInputElement) {
        el.value = startString;
      } else if (el instanceof HTMLElement) {
        el.innerText = startString;
      }

      if (elEnd instanceof HTMLInputElement) {
        elEnd.value = endString;
      } else if (elEnd instanceof HTMLElement) {
        elEnd.innerText = endString;
      }
    } else {
      const formatString = `${startString}${this.options.delimiter}${endString}`;

      if (el instanceof HTMLInputElement) {
        el.value = formatString;
      } else if (el instanceof HTMLElement) {
        el.innerText = formatString;
      }
    }
  }

  /**
   * 
   * @returns DateTime
   */
  private getStartDate(): DateTime {
    return this.options.startDate ? this.options.startDate.clone() : null;
  }

  /**
   * 
   * @returns 
   */
  private getEndDate(): DateTime {
    return this.options.endDate ? this.options.endDate.clone() : null;
  }

  /**
   * Handle `mouseenter` event
   * 
   * @param event 
   */
  private onMouseEnter(event) {
    const target = event.target;

    if (target instanceof HTMLElement) {
      if (this.isContainer(target)) {
        this.initializeRepick();
      }

      const element = target.closest('.unit');

      if (!(element instanceof HTMLElement)) return;

      if (this.picker.isCalendarDay(element)) {
        if (this.picker.datePicked.length !== 1) return;

        let date1 = this.picker.datePicked[0].clone();
        let date2 = new DateTime(element.dataset.time);
        let isFlipped = false;

        if (date1.isAfter(date2, 'day')) {
          const tempDate = date1.clone();
          date1 = date2.clone();
          date2 = tempDate.clone();
          isFlipped = true;
        }

        const days = [...this.picker.ui.container.querySelectorAll('.day')];

        days.forEach((d: HTMLElement) => {
          const date = new DateTime(d.dataset.time);
          const dayView = this.picker.Calendar.getCalendarDayView(date);

          if (date.isBetween(date1, date2)) {
            dayView.classList.add('in-range');
          }

          if (date.isSame(this.picker.datePicked[0], 'day')) {
            dayView.classList.add('start');
            dayView.classList.toggle('flipped', isFlipped);
          }

          if (d === element) {
            dayView.classList.add('end');
            dayView.classList.toggle('flipped', isFlipped);
          }

          d.className = dayView.className;
        });

        if (this.options.tooltip) {
          const diff = this.options.tooltipNumber(date2.diff(date1, 'day') + 1);

          if (diff > 0) {
            const pluralKey = new Intl.PluralRules(this.picker.options.lang).select(diff);
            const text = `${diff} ${this.options.locale[pluralKey]}`;

            this.showTooltip(element, text);
          } else {
            this.hideTooltip();
          }
        }
      }
    }
  }

  /**
   * Handle `mouseleave` event
   * 
   * @param event 
   */
  private onMouseLeave(event) {
    if (this.isContainer(event.target) && this.options.repick) {
      const start = this.getStartDate();
      const end = this.getEndDate();

      if (start && end) {
        this.picker.datePicked.length = 0;

        this.picker.renderAll();
      }
    }
  }

  /**
   * Handle `click` event
   * 
   * @param event 
   */
  private onClick(event) {
    const target = event.target;
    if (target instanceof HTMLElement) {
      const element = target.closest('.unit') as HTMLElement;

      if (!(element instanceof HTMLElement)) return;

      if (this.picker.isCalendarDay(element)) {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (this.picker.datePicked.length === 2) {
          this.picker.datePicked.length = 0;
        }

        const date = new DateTime(element.dataset.time);
        this.picker.datePicked[this.picker.datePicked.length] = date;

        if (this.picker.datePicked.length === 1) {
          if (!this.options.strict && this.picker.options.autoApply) {
            if (this.picker.options.element === this.triggerElement) {
              this.setStartDate(this.picker.datePicked[0]);
            }

            if (this.options.elementEnd === this.triggerElement) {
              this.setEndDate(this.picker.datePicked[0]);
            }

            this.picker.trigger('select', { start: this.picker.getStartDate(), end: this.picker.getEndDate() });
          }

          this.picker.renderAll();
        }

        if (this.picker.datePicked.length === 2) {
          if (this.picker.datePicked[0].isAfter(this.picker.datePicked[1])) {
            const tempDate = this.picker.datePicked[1].clone();
            this.picker.datePicked[1] = this.picker.datePicked[0].clone();
            this.picker.datePicked[0] = tempDate.clone();
          }

          if (this.picker.options.autoApply) {
            this.setDateRange(this.picker.datePicked[0], this.picker.datePicked[1]);

            this.picker.trigger('select', { start: this.picker.getStartDate(), end: this.picker.getEndDate() });

            this.picker.hide();
          } else {
            this.picker.trigger('preselect', {
              start: this.picker.datePicked[0],
              end: this.picker.datePicked[1],
            });

            this.hideTooltip();
          }
        }

        return;
      }

      if (this.picker.isApplyButton(element)) {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (this.picker.datePicked.length === 1 && !this.options.strict) {
          if (this.picker.options.element === this.triggerElement) {
            this.setStartDate(this.picker.datePicked[0]);
          }

          if (this.options.elementEnd === this.triggerElement) {
            this.setEndDate(this.picker.datePicked[0]);
          }
        }

        if (this.picker.datePicked.length === 2) {
          this.setDateRange(this.picker.datePicked[0], this.picker.datePicked[1]);
        }

        this.picker.trigger('select', { start: this.picker.getStartDate(), end: this.picker.getEndDate() });

        this.picker.hide();
        return;
      }
    }
  }

  /**
   * Displays tooltip of selected days
   * 
   * @param element 
   * @param text 
   */
  private showTooltip(element: HTMLElement, text: string) {
    this.tooltipElement.style.visibility = 'visible';
    this.tooltipElement.innerHTML = text;

    const container = this.picker.ui.container.getBoundingClientRect();
    const tooltip = this.tooltipElement.getBoundingClientRect();
    const day = element.getBoundingClientRect();
    let top = day.top;
    let left = day.left;

    top -= container.top;
    left -= container.left;

    top -= tooltip.height;
    left -= tooltip.width / 2;
    left += day.width / 2;

    this.tooltipElement.style.top = `${top}px`;
    this.tooltipElement.style.left = `${left}px`;
  }

  /**
   * Hide tooltip
   */
  private hideTooltip() {
    this.tooltipElement.style.visibility = 'hidden';
  }

  /**
   * Determines if the locale option contains all required plurals
   */
  private checkIntlPluralLocales() {
    if (!this.options.tooltip) return;

    const rules = [...new Set([
      new Intl.PluralRules(this.picker.options.lang).select(0),
      new Intl.PluralRules(this.picker.options.lang).select(1),
      new Intl.PluralRules(this.picker.options.lang).select(2),
      new Intl.PluralRules(this.picker.options.lang).select(6),
      new Intl.PluralRules(this.picker.options.lang).select(18),
    ])];

    const locales = Object.keys(this.options.locale);

    if (!rules.every(x => locales.includes(x))) {
      console.warn(`${this.getName()}: provide locales (${rules.join(', ')}) for correct tooltip text.`);
    }
  }

  /**
   * Handle `repick` option
   */
  private initializeRepick() {
    if (!this.options.repick) return;

    const start = this.getStartDate();
    const end = this.getEndDate();

    if (end && this.triggerElement === this.picker.options.element) {
      this.picker.datePicked[0] = end;
    }

    if (start && this.triggerElement === this.options.elementEnd) {
      this.picker.datePicked[0] = start;
    }
  }

  /**
   * Determines if the element is the picker container
   *  
   * @param element 
   * @returns Boolean
   */
  private isContainer(element: HTMLElement): boolean {
    return element === this.picker.ui.container;
  }
}
