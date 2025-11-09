'use client';

import { useEffect, useState } from 'react';
import { getTandas } from '../services/tandasService';
import { getProductos } from '../services/productosService';
import { Users, Package, TrendingUp, DollarSign } from 'lucide-react';
import Link from 'next/link'; // ← AGREGAR ESTO

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalTandas: 0,
    totalProductos: 0,
    tandasActivas: 0,
    productosStock: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const tandas = await getTandas();
    const productos = await getProductos();

    setStats({
      totalTandas: tandas.length,
      totalProductos: productos.length,
      tandasActivas: tandas.filter(t => t.disponible).length,
      productosStock: productos.reduce((sum, p) => sum + p.stock, 0),
    });
  };

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-2xl font-bold text-white">{stats.totalTandas}</span>
          </div>
          <p className="text-gray-400 text-sm">Total Tandas</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-2xl font-bold text-white">{stats.tandasActivas}</span>
          </div>
          <p className="text-gray-400 text-sm">Tandas Activas</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-white">{stats.totalProductos}</span>
          </div>
          <p className="text-gray-400 text-sm">Total Productos</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-pink-400" />
            </div>
            <span className="text-2xl font-bold text-white">{stats.productosStock}</span>
          </div>
          <p className="text-gray-400 text-sm">Unidades en Stock</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/tandas/nueva"
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-xl font-bold hover:shadow-lg transition-all text-center"
          >
            Nueva Tanda
          </Link>
          
          <Link
            href="/admin/productos/nuevo"
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 rounded-xl font-bold hover:shadow-lg transition-all text-center"
          >
            Nuevo Producto
          </Link>
        </div>
      </div>
    </div>
  );
}