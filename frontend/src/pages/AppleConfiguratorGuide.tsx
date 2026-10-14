import { useState } from 'react'
import { IconAlertTriangle, IconInfo, IconSmartphone } from '../components/Icons'

type Method = 'iphone' | 'mac'

const Check = ({ children }: { children: React.ReactNode }) => <li><span aria-hidden="true">✓</span>{children}</li>

function FlowDiagram() {
  return <div className="ac-flow" role="img" aria-label="Apple Configurator qurilmani Apple Business hisobiga qo‘shadi, markaziy administrator Tayyor MDM serveriga va do‘konga biriktiradi, telefon ADE orqali ulanadi">
    <div><b>1</b><strong>Configurator</strong><small>ABM hisobiga qo‘shadi</small></div><i>→</i>
    <div><b>2</b><strong>Markaziy tizim</strong><small>Do‘kon va ADE profili</small></div><i>→</i>
    <div><b>3</b><strong>Yangi iPhone</strong><small>Remote Management</small></div>
  </div>
}

function PairingVisual() {
  return <div className="ac-visual" role="img" aria-label="Boshqaruvchi iPhone yangi iPhone ekranidagi juftlash tasvirini skanerlaydi">
    <div className="ac-phone"><small>Boshqaruvchi iPhone</small><strong>Apple Configurator</strong><span className="ac-camera">⌗</span><em>Kamera bilan skanerlang</em></div>
    <div className="ac-arrow">→</div>
    <div className="ac-phone"><small>Qo‘shilayotgan iPhone</small><strong>Choose a Wi-Fi Network</strong><span className="ac-orb"><i /><i /><i /></span><em>Juftlash tasviri shu yerda chiqadi</em></div>
  </div>
}

function MacVisual() {
  return <div className="ac-mac" role="img" aria-label="Macdagi Prepare oynasida Manual Configuration va Add to Apple Business tanlangan">
    <div className="ac-macbar"><i/><i/><i/><span>Prepare Devices</span></div>
    <p><strong>Prepare with</strong> &nbsp; Manual Configuration</p>
    <label><span className="ac-checkbox checked">✓</span> Add to Apple Business</label>
    <label><span className="ac-checkbox" /> Activate and complete enrollment</label>
    <small>Ikkinchi belgi o‘chiq qoladi</small>
  </div>
}

export default function AppleConfiguratorGuide() {
  const [method, setMethod] = useState<Method>('iphone')
  return <div className="ac-page">
    <header className="ac-hero">
      <div>
        <span className="ac-kicker">QURILMA ULASH QO‘LLANMASI</span>
        <h1>Apple Configurator orqali iPhone ulash</h1>
        <p>Yangi iPhone’ni Apple Business hisobiga kiritish va Tayyor MDM markaziy boshqaruviga topshirish.</p>
      </div>
      <div className="ac-hero-icon"><IconSmartphone size={38}/></div>
    </header>

    <FlowDiagram />

    <div className="ac-warning"><IconAlertTriangle size={22}/><p><strong>Telefon ichidagi ma’lumotlar o‘chiriladi.</strong> Faqat tashkilotga tegishli yoki boshqarishga ruxsat berilgan qurilmada bajaring. Ishlatilgan telefonda avval iCloud’dan chiqing va Find My’ni o‘chiring.</p></div>

    <div className="ac-method-tabs" aria-label="Ulash usulini tanlash">
      <button className={method === 'iphone' ? 'active' : ''} onClick={() => setMethod('iphone')}>Boshqa iPhone orqali</button>
      <button className={method === 'mac' ? 'active' : ''} onClick={() => setMethod('mac')}>Mac orqali</button>
    </div>

    {method === 'iphone' ? <section className="ac-guide-card">
      <div className="ac-section-head"><span>01</span><div><h2>Boshqa iPhone orqali qo‘shish</h2><p>Boshqaruvchi iPhone’da Apple Configurator va kamida iOS 16 kerak.</p></div></div>
      <PairingVisual />
      <ol className="ac-steps">
        <li><b>Configurator’ga kiring</b><p>Boshqaruvchi iPhone’da Apple Configurator’ni oching va qurilma boshqarish vakolati bor tashkilot akkaunti bilan kiring.</p></li>
        <li><b>Tayyor MDM serverini tanlang</b><p>Settings’da Share Wi-Fi, MDM Server Assignment’da <strong>Specific → Tayyor MDM Production</strong> ni tanlang.</p></li>
        <li><b>Yangi telefonni kerakli ekranda to‘xtating</b><p>Telefonni tozalab, Setup Assistant orqali <strong>Choose a Wi-Fi Network</strong> ekranigacha boring. Undan o‘tib ketmang.</p></li>
        <li><b>Juftlash tasvirini skanerlang</b><p>Boshqaruvchi iPhone’ni yaqinlashtiring va yangi telefon ekranidagi tasvirni Configurator kamerasi bilan skanerlang. Pair Manually orqali olti raqamli kod ham ishlaydi.</p></li>
        <li><b>Jarayonni tugating</b><p>Yuklash tugagach <strong>Erase and Shut Down</strong> ni bosing. Telefonni hali oddiy sozlashdan oxirigacha o‘tkazmang.</p></li>
      </ol>
    </section> : <section className="ac-guide-card">
      <div className="ac-section-head"><span>02</span><div><h2>Mac orqali qo‘shish</h2><p>Apple Configurator o‘rnatilgan Mac va ma’lumot uzata oladigan USB kabel kerak.</p></div></div>
      <MacVisual />
      <ol className="ac-steps">
        <li><b>iPhone’ni ulang</b><p>Configurator’ni oching, telefonni USB orqali ulang. Zarur bo‘lsa qulfdan ochib Trust so‘rovini tasdiqlang.</p></li>
        <li><b>Prepare’ni tanlang</b><p>Qurilma ustida Prepare → Manual Configuration. <strong>Add to Apple Business</strong> yoqilsin, <strong>Activate and complete enrollment</strong> o‘chiq qolsin.</p></li>
        <li><b>Tashkilotga kiring</b><p>New Service’ni tanlang, Apple Business nomini kiriting va vakolatli tashkilot akkaunti bilan kiring. So‘ralganda yangi supervision identity yarating.</p></li>
        <li><b>Tarmoqni bering</b><p>Internetga chiqadigan Wi-Fi profilini tanlang. Mac administrator paroli so‘ralsa tasdiqlang va Prepare’ni boshlang.</p></li>
        <li><b>Setup Assistant’da qoldiring</b><p>Tayyorlash tugagach telefonni keyingi oddiy sozlashga o‘tkazmang. Markaziy administrator tekshiruvini kuting.</p></li>
      </ol>
    </section>}

    <section className="ac-handoff">
      <div className="ac-section-head"><span>03</span><div><h2>Markaziy administratorga topshiring</h2><p>Do‘kon xodimi maxfiy kalit yoki platforma tokenini kiritmaydi.</p></div></div>
      <div className="ac-handoff-grid"><div><h3>Quyidagilarni yuboring</h3><ul className="ac-checks"><Check>Do‘kon nomi</Check><Check>iPhone seriya raqami</Check><Check>Model va IMEI</Check><Check>Configurator jarayoni tugaganligi</Check></ul></div><div><h3>Administrator bajaradi</h3><ul className="ac-checks"><Check>ABM’da Tayyor MDM Production’ga biriktiradi</Check><Check>Seriyani aynan shu do‘konga taqsimlaydi</Check><Check>ADE profilini tayinlaydi</Check><Check>Ulashga ruxsat beradi</Check></ul></div></div>
    </section>

    <section className="ac-final">
      <div className="ac-section-head"><span>04</span><div><h2>Telefonda boshqaruvni yakunlang</h2><p>Administrator tayyorligini tasdiqlagandan keyin bajaring.</p></div></div>
      <ol className="ac-steps compact"><li><b>Telefonni yoqing va Wi-Fi’ga ulang.</b></li><li><b>Remote Management yoki Device Management ekranini kuting.</b></li><li><b>Enroll this iPhone ni bosing.</b> Oddiy QR profilini o‘rnatmang.</li><li><b>Panelda qurilma holatini tekshiring.</b> Seriya, do‘kon va oxirgi ulanish to‘g‘ri bo‘lsin.</li></ol>
      <div className="ac-note"><IconInfo size={20}/><p>Configurator orqali qo‘shilgan qurilmada Apple’ning 30 kunlik vaqtinchalik <strong>Leave Remote Management</strong> huquqi bo‘lishi mumkin. Uni sinov uchun bosmang.</p></div>
    </section>

    <section className="ac-checklist"><h2>Topshirishdan oldingi tekshiruv</h2><ul className="ac-checks"><Check>Telefon, ABM va paneldagi seriya bir xil</Check><Check>Remote Management muvaffaqiyatli tugadi</Check><Check>Panelda qurilma onlayn va to‘g‘ri do‘konda</Check><Check>Oddiy QR profil qo‘shimcha o‘rnatilmadi</Check></ul></section>
  </div>
}
