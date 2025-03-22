"use client";
import { useState, useEffect } from 'react';
import Head from 'next/head';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';

// API基础URL，根据实际部署情况修改
const API_BASE_URL = 'https://pg-server.yichamao.com';

export default function Home() {
  // 状态管理
  const [query, setQuery] = useState('SELECT * FROM instructor LIMIT 10;');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbInfo, setDbInfo] = useState(null);
  const [health, setHealth] = useState(null);

  const [darkMode, setDarkMode] = useState(false);

  // 页面加载时获取健康状态和数据库信息
  useEffect(() => {
    async function fetchInitialData() {
      try {
        // 健康检查
        const healthResponse = await fetch(`${API_BASE_URL}/health`);
        const healthData = await healthResponse.json();
        setHealth(healthData);

        // 数据库信息
        const dbInfoResponse = await fetch(`${API_BASE_URL}/database-info`);
        const dbInfoData = await dbInfoResponse.json();
        setDbInfo(dbInfoData);
      } catch (err) {
        console.error('Init Database Error:', err);
        setError('Cannot connect to the database');
      }
    }

    fetchInitialData();
  }, []);

  // 执行SQL查询
  const executeQuery = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(`${API_BASE_URL}/execute-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-950">
      <Head>
        <title>SQL 学习平台</title>
        <meta name="description" content="一个用于学习SQL的交互式平台" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">SQL Learning Platform</h1>

        {/* 系统状态信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">系统状态</h2>
            {health ? (
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-2 ${
                    health.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></div>
                <span className="text-gray-700">
                  {health.status === 'healthy' ? '系统正常运行中' : '系统异常'}
                </span>
              </div>
            ) : (
              <p>Loading...</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">数据库信息</h2>
            {dbInfo ? (
              <ul className="text-gray-700">
                <li className="mb-2">
                  <span className="font-medium">数据库大小: </span>
                  {dbInfo.database_size}
                </li>
                <li className="mb-2">
                  <span className="font-medium">表数量: </span>
                  {dbInfo.table_count}
                </li>
                <li className="mb-2">
                  <span className="font-medium">PostgreSQL版本: </span>
                  {dbInfo.postgres_version}
                </li>
              </ul>
            ) : (
              <p>加载中...</p>
            )}
          </div>
        </div>

        {/* SQL查询区域 */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">SQL查询</h2>
          <div className="mb-4 border border-gray-300 rounded-md overflow-hidden">
            <CodeMirror
              value={query}
              height="200px"
              extensions={[sql()]}
              theme={oneDark}
              onChange={(value) => setQuery(value)}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex justify-between items-center">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
              onClick={executeQuery}
              disabled={loading || !query.trim()}
            >
              {loading ? '执行中...' : '执行查询'}
            </button>
            <p className="text-sm text-gray-700">注意: 只支持SELECT查询</p>
          </div>
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-700 text-red-700 p-4 mb-6">
            <p className="font-bold">错误</p>
            <p>{error}</p>
          </div>
        )}

        {/* 查询结果 */}
        {results && (
          <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">查询结果</h2>
            <div className="mb-2 text-sm text-gray-600">
              返回 {results.rowCount} 行数据
              {results.hasMore && ' (超出显示限制，只显示前1000行)'}
            </div>

            {results.columns.length > 0 ? (
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    {results.columns.map((column, index) => (
                      <th
                        key={index}
                        className="py-2 px-4 border-b text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.rows.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      {results.columns.map((column, colIndex) => (
                        <td
                          key={colIndex}
                          className="py-2 px-4 border-b text-sm text-gray-700"
                        >
                          {row[column] === null
                            ? <span className="text-gray-400 italic">NULL</span>
                            : typeof row[column] === 'object'
                              ? JSON.stringify(row[column])
                              : String(row[column])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-700">查询未返回任何列</p>
            )}
          </div>
        )}
      </main>

      <footer className="border-t mt-12 py-6 text-center text-white text-sm">
        <p>SQL学习平台 By CHEN Zhongpu &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}