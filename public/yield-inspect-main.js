import { loadSdaiCase } from './data/sdai-case.js';
import { initPageAccess } from './ui/page-access.js';

const record = await loadSdaiCase();
const format = (value, precision = 2) => value.toLocaleString('en-US', {
  maximumFractionDigits: precision,
  minimumFractionDigits: precision,
});
const percent = value => value.toLocaleString('en-US', { maximumFractionDigits: 2 }) + '%';
const dai = value => format(value) + ' DAI';
const displays = {
  entrySavingsApy: percent(record.entrySavingsApy),
  entryImpliedApy: percent(record.entryImpliedApy),
  changedSavingsApy: percent(record.changedSavingsApy),
  maximumYtDai: dai(record.maximumYtDai),
  feePercent: percent(record.feePercent),
  ytUnits: format(record.ytUnits, 0) + ' DAI',
  flatYtDai: dai(record.flatYtDai),
  periodYieldPercent: format(record.periodYieldPercent, 4) + '%',
  expiryYtDai: dai(record.expiryYtDai),
  annualizedYieldPercent: percent(record.annualizedYieldPercent),
  'original.pt': format(record.original.pt),
  'original.hold': format(record.original.hold),
  'small.pt': format(record.small.pt),
  'small.yt': format(record.small.yt),
  'small.hold': format(record.small.hold),
};

for (const element of document.querySelectorAll('[data-value]')) {
  element.textContent = displays[element.dataset.value];
}
const meter = document.getElementById('case-capacity-meter');
meter.value = record.maximumYtDai;
meter.setAttribute('aria-valuetext', dai(record.maximumYtDai) + ' out of 1,000 DAI');
const navigation = document.querySelector('.case-navigation');
const links = [...navigation.querySelectorAll('a')];
const panels = [...document.querySelectorAll('.case-panel')];
const { refreshOffsets } = initPageAccess();

function showStage(moveFocus) {
  const panel = panels.find(item => '#' + item.id === location.hash) ?? panels[0];
  for (const stage of panels) stage.hidden = stage !== panel;
  for (const link of links) {
    if (link.hash === '#' + panel.id) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
  }
  if (moveFocus) {
    panel.querySelector('h2').focus({ preventScroll: true });
    refreshOffsets();
    const bounds = navigation.getBoundingClientRect();
    if (bounds.top < document.querySelector('.topbar').getBoundingClientRect().bottom || bounds.bottom > innerHeight) {
      navigation.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }
}

for (const link of [...links, ...document.querySelectorAll('.case-next')]) {
  link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    showStage(true);
  });
}
window.addEventListener('hashchange', () => showStage(true));
showStage(false);
