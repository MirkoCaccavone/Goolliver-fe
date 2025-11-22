import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const colors = {
    user: '#007bff',
    entry: '#ffc107',
    moderated: '#28a745',
    credit: '#17a2b8',
};

function fillDays(trend, days = 30) {
    const arr = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        arr.push({
            day: key,
            value: Number(trend[key] || 0),
        });
    }
    return arr;
}

const TrendChart = ({ title, trend, color, yLabel, days = 30 }) => {
    const data = fillDays(trend, days);
    return (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: 20, marginBottom: 24 }}>
            <h3 style={{ marginBottom: 10, fontSize: '1.1rem', color: '#333' }}>{title}</h3>
            <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} minTickGap={3} />
                    <YAxis tick={{ fontSize: 12 }} width={40} label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fontSize: 12 } : undefined} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} name={title} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TrendChart;
