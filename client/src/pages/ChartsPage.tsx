
import { Chart, Series, ArgumentAxis, CommonSeriesSettings, Legend, Tooltip } from 'devextreme-react/chart'

const data = Array.from({length: 30}).map((_,i)=>({ day: i+1, value: Math.round(50 + 30*Math.sin(i/4)) }))

export default function ChartsPage() {
  return (
    <div style={{padding:'16px'}}>
      <h3>Throughput (synthetic)</h3>
      <Chart dataSource={data} id='chart' style={{height:'calc(100vh - 120px)'}}>
        <CommonSeriesSettings argumentField='day'/>
        <Series valueField='value' type='line'/>
        <ArgumentAxis title='Day'/>
        <Legend visible={false}/>
        <Tooltip enabled={true}/>
      </Chart>
    </div>
  )
}
