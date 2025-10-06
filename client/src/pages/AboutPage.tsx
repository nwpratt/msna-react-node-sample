
export default function AboutPage() {
  return (
    <div style={{padding:'16px', lineHeight:1.6}}>
      <h3>About</h3>
      <p>This is a portfolio demo showcasing a self-healing dev setup:
        React (Vite), Cesium globe with OpenFlights sample routes (via Node/Express proxy),
        and DevExtreme charts.</p>
      <ul>
        <li>Server: <code>http://localhost:5001</code></li>
        <li>Client: <code>http://localhost:5173</code></li>
      </ul>
      <p>Set your Cesium ion token in <code>client/.env</code> as:
        <code>VITE_CESIUM_ION_TOKEN=your_token_here</code>.</p>
    </div>
  )
}
