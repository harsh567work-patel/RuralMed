import Ic from './Icons';

export default function Toasts({ list }) {
  return (
    <div className="twrap">
      {list.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === 'success' && <Ic n="check" s={14} />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}
