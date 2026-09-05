import { useEffect, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Banknote, Boxes, CalendarDays, ChevronDown, Download, FileSpreadsheet, FileText, PackageCheck, Printer, ReceiptText, ShoppingBag, ShoppingCart, TrendingUp, UsersRound, WalletCards } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import "./Reports.css";

const languageKey = "afghan-power-language";
const rtlLanguages = new Set(["fa", "ps"]);
const copy = {
  en: { title:"Reports overview",subtitle:"A clear view of sales, purchases, inventory and account performance.",ui:"UI preview",period:"This month",export:"Export report",sales:"Total sales",purchases:"Total purchases",profit:"Estimated profit",receivables:"Receivables",payables:"Payables",products:"Active products",customers:"Active customers",transactions:"Transactions",vs:"from last month",performance:"Sales and purchase performance",performanceHint:"Monthly comparison of financial activity",cashFlow:"Cash-flow trend",cashFlowHint:"Income and expense movement",inventory:"Inventory distribution",inventoryHint:"Stock grouped by medicine category",activity:"Recent monthly activity",activityHint:"Number of sales and purchase documents",sale:"Sales",purchase:"Purchases",income:"Income",expense:"Expense",antibiotics:"Antibiotics",vitamins:"Vitamins",painkillers:"Painkillers",other:"Other",today:"Today",yesterday:"Yesterday",lastWeek:"Last week",lastMonth:"Last month",lastYear:"Last year",custom:"Custom",excel:"Excel",pdf:"PDF",print:"Print",csv:"CSV" },
  fa: { title:"نمای کلی راپورها",subtitle:"نمای واضح از عملکرد فروشات، خریداری، موجودی و حساب‌ها.",ui:"نمونهٔ UI",period:"ماه جاری",export:"خروجی راپور",sales:"مجموع فروشات",purchases:"مجموع خریداری",profit:"مفاد تخمینی",receivables:"طلبات",payables:"تادیات",products:"محصولات فعال",customers:"مشتریان فعال",transactions:"معاملات",vs:"نسبت به ماه گذشته",performance:"عملکرد فروشات و خریداری",performanceHint:"مقایسهٔ ماهانهٔ فعالیت‌های مالی",cashFlow:"روند جریان نقدی",cashFlowHint:"تغییرات عواید و مصارف",inventory:"تقسیم‌بندی موجودی",inventoryHint:"موجودی دواها بر اساس کتگوری",activity:"فعالیت ماه‌های اخیر",activityHint:"تعداد اسناد فروش و خرید",sale:"فروشات",purchase:"خریداری",income:"عواید",expense:"مصارف",antibiotics:"انتی‌بیوتیک",vitamins:"ویتامین‌ها",painkillers:"مسکن‌ها",other:"سایر",today:"امروز",yesterday:"دیروز",lastWeek:"هفته قبل",lastMonth:"ماه قبل",lastYear:"سال قبل",custom:"دلخواه",excel:"Excel",pdf:"PDF",print:"Print",csv:"CSV" },
  ps: { title:"د راپورونو عمومي کتنه",subtitle:"د خرڅلاو، پېرود، موجودۍ او حسابونو روښانه کتنه.",ui:"د UI بېلګه",period:"روانه میاشت",export:"راپور صادرول",sales:"ټول خرڅلاو",purchases:"ټول پېرود",profit:"اټکلي ګټه",receivables:"ترلاسه کېدونکي",payables:"ورکول کېدونکي",products:"فعال محصولات",customers:"فعال پېرودونکي",transactions:"معاملې",vs:"د تېرې میاشتې په پرتله",performance:"د خرڅلاو او پېرود فعالیت",performanceHint:"د مالي فعالیتونو میاشتنۍ پرتله",cashFlow:"د نغدي جریان بهیر",cashFlowHint:"د عوایدو او لګښتونو بدلون",inventory:"د موجودۍ وېش",inventoryHint:"د درملو موجودي د کتګورۍ له مخې",activity:"د وروستیو میاشتو فعالیت",activityHint:"د خرڅلاو او پېرود اسناد",sale:"خرڅلاو",purchase:"پېرود",income:"عواید",expense:"لګښت",antibiotics:"انټي‌بیوټیک",vitamins:"ویټامینونه",painkillers:"درد کموونکي",other:"نور",today:"نن",yesterday:"پرون",lastWeek:"تېره اوونۍ",lastMonth:"تېره میاشت",lastYear:"تېر کال",custom:"دلخواه",excel:"Excel",pdf:"PDF",print:"Print",csv:"CSV" },
};

const monthlyData = [
  {month:"حمل",sales:580,purchases:390,income:480,expense:310},{month:"ثور",sales:720,purchases:460,income:610,expense:360},{month:"جوزا",sales:660,purchases:420,income:570,expense:345},
  {month:"سرطان",sales:890,purchases:570,income:760,expense:430},{month:"اسد",sales:820,purchases:510,income:710,expense:405},{month:"سنبله",sales:1040,purchases:640,income:910,expense:490},
];
const inventoryData = [{key:"antibiotics",value:34,color:"#4f46e5"},{key:"vitamins",value:27,color:"#10b981"},{key:"painkillers",value:22,color:"#f59e0b"},{key:"other",value:17,color:"#38bdf8"}];
const activityData = [{month:"حمل",sales:42,purchases:28},{month:"ثور",sales:54,purchases:34},{month:"جوزا",sales:49,purchases:31},{month:"سرطان",sales:68,purchases:43},{month:"اسد",sales:63,purchases:39},{month:"سنبله",sales:76,purchases:46}];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return <div className="report-chart-tooltip"><strong>{label}</strong>{payload.map(item=><span key={item.dataKey} style={{color:item.color}}>{item.name}: {item.value}</span>)}</div>;
}

function ChartHead({ title, hint, icon: Icon, tone="" }) {
  return <div className="report-chart-head"><div><h2>{title}</h2><p>{hint}</p></div><span className={`report-chart-head-icon ${tone}`}><Icon size={17}/></span></div>;
}

export default function Reports(){
  const [language,setLanguage]=useState(()=>localStorage.getItem(languageKey)||"en");
  const [periodOpen,setPeriodOpen]=useState(false);
  const [exportOpen,setExportOpen]=useState(false);
  const [periodKey,setPeriodKey]=useState("period");
  const periodRef=useRef(null);
  const exportRef=useRef(null);
  const t=copy[language]||copy.en;
  const direction=rtlLanguages.has(language)?"rtl":"ltr";
  useEffect(()=>{const sync=()=>setLanguage(localStorage.getItem(languageKey)||"en");window.addEventListener("app-language-updated",sync);window.addEventListener("storage",sync);return()=>{window.removeEventListener("app-language-updated",sync);window.removeEventListener("storage",sync)}},[]);
  useEffect(()=>{
    const closeMenus=(event)=>{
      if(periodRef.current&&!periodRef.current.contains(event.target)) setPeriodOpen(false);
      if(exportRef.current&&!exportRef.current.contains(event.target)) setExportOpen(false);
    };
    document.addEventListener("pointerdown",closeMenus);
    return()=>document.removeEventListener("pointerdown",closeMenus);
  },[]);
  const periodOptions=[
    {key:"today",label:t.today},
    {key:"yesterday",label:t.yesterday},
    {key:"lastWeek",label:t.lastWeek},
    {key:"lastMonth",label:t.lastMonth},
    {key:"lastYear",label:t.lastYear},
    {key:"custom",label:t.custom},
  ];
  const exportOptions=[
    {key:"excel",label:t.excel,icon:FileSpreadsheet},
    {key:"pdf",label:t.pdf,icon:FileText},
    {key:"print",label:t.print,icon:Printer},
    {key:"csv",label:t.csv,icon:FileSpreadsheet},
  ];
  const stats=[
    {label:t.sales,value:"350,620 AFN",change:"+12.5%",trend:"up",icon:ShoppingBag,tone:"indigo"},{label:t.purchases,value:"215,940 AFN",change:"+8.2%",trend:"up",icon:ShoppingCart,tone:"blue"},
    {label:t.profit,value:"134,680 AFN",change:"+18.4%",trend:"up",icon:TrendingUp,tone:"green"},{label:t.receivables,value:"64,250 AFN",change:"-3.1%",trend:"down",icon:WalletCards,tone:"amber"},
    {label:t.payables,value:"41,500 AFN",change:"+2.6%",trend:"up",icon:Banknote,tone:"rose"},{label:t.products,value:"1,248",change:"+36",trend:"up",icon:Boxes,tone:"violet"},
    {label:t.customers,value:"896",change:"+6.8%",trend:"up",icon:UsersRound,tone:"cyan"},{label:t.transactions,value:"2,430",change:"+14.1%",trend:"up",icon:ReceiptText,tone:"slate"},
  ];
  const axis={fontSize:10,fill:"var(--text-secondary,#64748b)"};
  return <div className="report-dashboard" dir={direction}>
    <header className="report-dashboard-head"><div><div className="report-title-line"><h1>{t.title}</h1><span>{t.ui}</span></div><p>{t.subtitle}</p></div><div className="report-head-actions">
      <div className="report-action-dropdown" ref={periodRef}>
        <button type="button" className={`report-dropdown-trigger ${periodOpen?"is-open":""}`} aria-haspopup="menu" aria-expanded={periodOpen} onClick={()=>{setPeriodOpen(v=>!v);setExportOpen(false)}}>
          <CalendarDays size={16}/><span>{periodKey==="period"?t.period:t[periodKey]}</span><ChevronDown size={14} className="report-dropdown-chevron"/>
        </button>
        {periodOpen&&<div className="report-dropdown-menu period-menu" role="menu">
          {periodOptions.map(option=><button key={option.key} type="button" role="menuitem" className={periodKey===option.key?"active":""} onClick={()=>{setPeriodKey(option.key);setPeriodOpen(false)}}><span>{option.label}</span></button>)}
        </div>}
      </div>
      <div className="report-action-dropdown" ref={exportRef}>
        <button type="button" className={`primary report-dropdown-trigger ${exportOpen?"is-open":""}`} aria-haspopup="menu" aria-expanded={exportOpen} onClick={()=>{setExportOpen(v=>!v);setPeriodOpen(false)}}>
          <Download size={16}/><span>{t.export}</span><ChevronDown size={14} className="report-dropdown-chevron"/>
        </button>
        {exportOpen&&<div className="report-dropdown-menu export-menu" role="menu">
          {exportOptions.map(({key,label,icon:Icon})=><button key={key} type="button" role="menuitem" onClick={()=>setExportOpen(false)}><span className={`report-export-icon ${key}`}><Icon size={15}/></span><span>{label}</span></button>)}
        </div>}
      </div>
    </div></header>

    <section className="report-kpi-grid">{stats.map(({label,value,change,trend,icon:Icon,tone})=><article className={`report-kpi-card tone-${tone}`} key={label}><div className="report-kpi-top"><span className="report-kpi-icon"><Icon size={18}/></span><span className={`report-kpi-change ${trend}`}>{trend==="up"?<ArrowUpRight size={13}/>:<ArrowDownRight size={13}/>} {change}</span></div><span className="report-kpi-label">{label}</span><strong>{value}</strong><small>{t.vs}</small></article>)}</section>

    <section className="report-chart-grid">
      <article className="report-chart-card report-chart-wide"><ChartHead title={t.performance} hint={t.performanceHint} icon={TrendingUp}/><div className="report-chart-body"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyData} barGap={8} margin={{top:18,right:4,left:-16,bottom:0}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--report-grid,#e8edf3)"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={axis}/><YAxis axisLine={false} tickLine={false} tick={axis}/><Tooltip content={<ChartTooltip/>} cursor={{fill:"rgba(79,70,229,.04)"}}/><Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11,paddingTop:12}}/><Bar dataKey="sales" name={t.sale} fill="#4f46e5" radius={[5,5,0,0]} maxBarSize={30}/><Bar dataKey="purchases" name={t.purchase} fill="#22c55e" radius={[5,5,0,0]} maxBarSize={30}/></BarChart></ResponsiveContainer></div></article>

      <article className="report-chart-card"><ChartHead title={t.cashFlow} hint={t.cashFlowHint} icon={Banknote} tone="green"/><div className="report-chart-body"><ResponsiveContainer width="100%" height="100%"><AreaChart data={monthlyData} margin={{top:18,right:6,left:-20,bottom:0}}><defs><linearGradient id="reportIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient><linearGradient id="reportExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={.22}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--report-grid,#e8edf3)"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={axis}/><YAxis axisLine={false} tickLine={false} tick={axis}/><Tooltip content={<ChartTooltip/>}/><Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11,paddingTop:12}}/><Area type="monotone" dataKey="income" name={t.income} stroke="#10b981" strokeWidth={2.4} fill="url(#reportIncome)"/><Area type="monotone" dataKey="expense" name={t.expense} stroke="#f59e0b" strokeWidth={2.2} fill="url(#reportExpense)"/></AreaChart></ResponsiveContainer></div></article>

      <article className="report-chart-card report-chart-compact"><ChartHead title={t.inventory} hint={t.inventoryHint} icon={PackageCheck} tone="amber"/><div className="report-donut-layout"><div className="report-donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={inventoryData} dataKey="value" innerRadius="62%" outerRadius="88%" paddingAngle={4} stroke="none">{inventoryData.map(item=><Cell key={item.key} fill={item.color}/>)}</Pie></PieChart></ResponsiveContainer><div><strong>1,248</strong><span>{t.products}</span></div></div><div className="report-donut-legend">{inventoryData.map(item=><span key={item.key}><i style={{background:item.color}}/><b>{t[item.key]}</b><em>{item.value}%</em></span>)}</div></div></article>

      <article className="report-chart-card report-chart-compact"><ChartHead title={t.activity} hint={t.activityHint} icon={ReceiptText} tone="cyan"/><div className="report-chart-body compact"><ResponsiveContainer width="100%" height="100%"><BarChart data={activityData} layout="vertical" margin={{top:2,right:18,left:8,bottom:0}}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--report-grid,#e8edf3)"/><XAxis type="number" axisLine={false} tickLine={false} tick={axis}/><YAxis type="category" dataKey="month" width={42} axisLine={false} tickLine={false} tick={axis}/><Tooltip content={<ChartTooltip/>} cursor={{fill:"rgba(79,70,229,.04)"}}/><Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/><Bar dataKey="sales" name={t.sale} fill="#6366f1" radius={[0,5,5,0]} maxBarSize={9}/><Bar dataKey="purchases" name={t.purchase} fill="#38bdf8" radius={[0,5,5,0]} maxBarSize={9}/></BarChart></ResponsiveContainer></div></article>
    </section>
  </div>
}
