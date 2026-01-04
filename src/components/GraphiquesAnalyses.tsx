import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface GraphiqueTendanceProps {
  data: Array<{ date: string; total: number }>;
}

export function GraphiqueTendance({ data }: GraphiqueTendanceProps) {
  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Cigarettes par jour',
        data: data.map(d => d.total),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Objectif (12 cigarettes)',
        data: data.map(() => 12),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: (context: any) => {
            if (context.datasetIndex === 1) {
              return 'Objectif: 12 cigarettes';
            }
            return `${context.parsed.y} cigarette${context.parsed.y > 1 ? 's' : ''}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: '#6b7280'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          color: '#6b7280',
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="h-[300px]">
      <Line data={chartData} options={options} />
    </div>
  );
}

interface GraphiqueSituationsProps {
  data: Record<string, { total: number; pourcentage: number }>;
  labels: Record<string, string>;
}

export function GraphiqueSituations({ data, labels }: GraphiqueSituationsProps) {
  const sortedData = Object.entries(data)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);

  const chartData = {
    labels: sortedData.map(([key]) => labels[key] || key),
    datasets: [
      {
        data: sortedData.map(([, value]) => value.total),
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',   // red
          'rgba(249, 115, 22, 0.8)',  // orange  
          'rgba(234, 179, 8, 0.8)',   // yellow
          'rgba(34, 197, 94, 0.8)',   // green
          'rgba(59, 130, 246, 0.8)',  // blue
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(249, 115, 22)',
          'rgb(234, 179, 8)',
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
        ],
        borderWidth: 2,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 15,
          font: {
            size: 12
          },
          generateLabels: (chart: any) => {
            const data = chart.data;
            return data.labels.map((label: string, i: number) => ({
              text: `${label} (${data.datasets[0].data[i]})`,
              fillStyle: data.datasets[0].backgroundColor[i],
              strokeStyle: data.datasets[0].borderColor[i],
              lineWidth: 2,
              hidden: false,
              index: i
            }));
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          label: (context: any) => {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${value} cigarettes (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="h-[300px]">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

interface GraphiqueHorairesProps {
  data: Record<string, { total: number; pourcentage: number }>;
}

export function GraphiqueHoraires({ data }: GraphiqueHorairesProps) {
  const tranches = [
    { id: '06h-09h', label: '06h-09h', emoji: '🌅' },
    { id: '09h-12h', label: '09h-12h', emoji: '☀️' },
    { id: '12h-15h', label: '12h-15h', emoji: '🍽️' },
    { id: '15h-18h', label: '15h-18h', emoji: '☕' },
    { id: '18h-21h', label: '18h-21h', emoji: '🌆' },
    { id: '21h-00h', label: '21h-00h', emoji: '🌙' },
    { id: '00h-06h', label: '00h-06h', emoji: '🌃' },
  ];

  const chartData = {
    labels: tranches.map(t => `${t.emoji} ${t.label}`),
    datasets: [
      {
        label: 'Cigarettes',
        data: tranches.map(t => data[t.id]?.total || 0),
        backgroundColor: 'rgba(234, 179, 8, 0.8)',
        borderColor: 'rgb(234, 179, 8)',
        borderWidth: 2,
        borderRadius: 8,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.y;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${value} cigarettes (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: '#6b7280'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          color: '#6b7280'
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="h-[300px]">
      <Bar data={chartData} options={options} />
    </div>
  );
}

interface GraphiqueLieuxProps {
  data: Record<string, { total: number; pourcentage: number }>;
  labels: Record<string, string>;
}

export function GraphiqueLieux({ data, labels }: GraphiqueLieuxProps) {
  const sortedData = Object.entries(data)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 8);

  const chartData = {
    labels: sortedData.map(([key]) => labels[key] || key),
    datasets: [
      {
        label: 'Cigarettes',
        data: sortedData.map(([, value]) => value.total),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2,
        borderRadius: 8,
      }
    ]
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.x;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${value} cigarettes (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: '#6b7280'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      y: {
        ticks: {
          color: '#6b7280'
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="h-[400px]">
      <Bar data={chartData} options={options} />
    </div>
  );
}
