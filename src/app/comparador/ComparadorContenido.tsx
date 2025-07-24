'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function ComparadorContenido() {
  const searchParams = useSearchParams();
  const comparativaId = searchParams.get('id');
  const idAgenteQR = searchParams.get('idAgente');
  const idLugarQR = searchParams.get('idLugar');

  const [tipoComparador, setTipoComparador] = useState<'luz' | 'gas' | 'telefonia'>('luz');
  const [nombreAgente, setNombreAgente] = useState('');
  const [nombreLugar, setNombreLugar] = useState('');
  const [tipoCliente, setTipoCliente] = useState('particular');
  const [tipoTarifa, setTipoTarifa] = useState('fija');
  const [nombreTarifa, setNombreTarifa] = useState('2.0TD');
  const [cups, setCups] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [consumoPeriodos, setConsumoPeriodos] = useState<Record<string, string>>({ P1: '', P2: '', P3: '', P4: '', P5: '', P6: '' });
  const [potencias, setPotencias] = useState<Record<string, string>>({ P1: '', P2: '', P3: '', P4: '', P5: '', P6: '' });
  const [consumoAnual, setConsumoAnual] = useState('');
  const [importeFactura, setImporteFactura] = useState('');
  const [iva, setIva] = useState('21');
  const [reactiva, setReactiva] = useState('');
  const [exceso, setExceso] = useState('');
  const [alquiler, setAlquiler] = useState('');
  const [otros, setOtros] = useState('');
  const [mostrarGrafica, setMostrarGrafica] = useState(false);
  const [nombreCliente, setNombreCliente] = useState('');
  const [direccionCliente, setDireccionCliente] = useState('');
  const [impuestoElectricidad, setImpuestoElectricidad] = useState('5.113');
  const [territorio, setTerritorio] = useState('peninsula');
  const [resultados, setResultados] = useState<any[]>([]);
  const [orden, setOrden] = useState<'compañia' | 'ahorro' | 'comision'>('ahorro');

  const ordenarResultados = (criterio: 'compañia' | 'ahorro' | 'comision') => {
    const resultadosOrdenados = [...resultados].sort((a, b) => {
      if (criterio === 'compañia') return a.compañia.localeCompare(b.compañia);
      if (criterio === 'ahorro') return b.ahorro - a.ahorro;
      if (criterio === 'comision') return b.comision - a.comision;
      return 0;
    });
    setResultados(resultadosOrdenados);
    setOrden(criterio);
  };

  const isTarifa20TD = nombreTarifa === '2.0TD';
  const periodosConsumo = isTarifa20TD ? ['P1', 'P2', 'P3'] : ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
  const periodosPotencia = isTarifa20TD ? ['P1', 'P2'] : ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];

  useEffect(() => {
    const suma = periodosConsumo.reduce((acc, p) => acc + (parseFloat(consumoPeriodos[p as keyof typeof consumoPeriodos] || '0')), 0);
    const anual = suma * 12;
    setConsumoAnual(anual.toFixed(2));
  }, [consumoPeriodos, nombreTarifa]);
  

  useEffect(() => {
    if (!comparativaId) return;
    const cargarComparativa = async () => {
      try {
        const res = await fetch(`/api/comparativas/${comparativaId}`);
        const data = await res.json();
        setNombreAgente(data.agente?.nombre || '');
        setNombreLugar(data.lugar?.nombre || '');
        setTipoTarifa(data.tipoTarifa);
        setNombreTarifa(data.nombreTarifa);
        setConsumoAnual(data.consumoAnual);
        setImporteFactura(data.importeFactura);
        setNombreCliente(data.cliente?.nombre || '');
        setDireccionCliente(data.cliente?.direccion || '');
        setResultados(data.resultados || []);
        const df = data.datosFactura || {};
        setTipoCliente(df.tipoCliente || 'particular');
        setCups(df.cups || '');
        setFechaInicio(df.fechaInicio || '');
        setFechaFin(df.fechaFin || '');
        setConsumoPeriodos(df.consumoPeriodos || {});
        setPotencias(df.potencias || {});
        setIva(df.iva || '21');
        setImpuestoElectricidad(df.impuestoElectricidad || '5.113');
        setTerritorio(df.territorio || 'peninsula');
        setReactiva(df.reactiva || '');
        setExceso(df.exceso || '');
        setAlquiler(df.alquiler || '');
        setOtros(df.otros || '');
      } catch (error) {
        console.error('Error cargando comparativa:', error);
      }
    };
    cargarComparativa();
  }, [comparativaId]);

  useEffect(() => {
    if (!comparativaId && idAgenteQR && idLugarQR) {
      const fetchAgenteYLugar = async () => {
        try {
          const [resAgente, resLugar] = await Promise.all([
            fetch(`/api/agentes/${idAgenteQR}`),
            fetch(`/api/lugares/${idLugarQR}`)
          ]);
          const agente = await resAgente.json();
          const lugar = await resLugar.json();
          setNombreAgente(agente.nombre || '');
          setNombreLugar(lugar.nombre || '');
        } catch (error) {
          console.error('Error cargando agente o lugar desde QR:', error);
        }
      };
      fetchAgenteYLugar();
    }
  }, [comparativaId, idAgenteQR, idLugarQR]);

  useEffect(() => {
    if (!comparativaId) {
      setTipoCliente('particular');
      setTipoTarifa('fija');
      setNombreTarifa('2.0TD');
      setCups('');
      setFechaInicio('');
      setFechaFin('');
      setConsumoPeriodos({ P1: '', P2: '', P3: '', P4: '', P5: '', P6: '' });
      setPotencias({ P1: '', P2: '', P3: '', P4: '', P5: '', P6: '' });
      setConsumoAnual('');
      setImporteFactura('');
      setIva('21');
      setImpuestoElectricidad('5.113');
      setTerritorio('peninsula');
      setReactiva('');
      setExceso('');
      setAlquiler('');
      setOtros('');
      setNombreCliente('');
      setDireccionCliente('');
      setResultados([]);
    }
  }, [comparativaId]);

  const handlePeriodoChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    setConsumoPeriodos({ ...consumoPeriodos, [key]: e.target.value });
  };
  

  const handlePotenciaChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    setPotencias({ ...potencias, [key]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const consumoTotal = periodosConsumo.reduce((sum, key) => sum + (parseFloat(consumoPeriodos[key]) || 0), 0);
    const facturaNum = parseFloat(importeFactura) || 0;

    if (consumoTotal <= 0 || facturaNum <= 0) {
      alert("Introduce consumo y factura válidos.");
      return;
    }

    const tarifas = [
      { id: 1, compañia: 'AUDAX', tarifa: 'CLASSIC P1-P6', precio_kwh: 0.14, comision_kwh: 0.003 },
      { id: 2, compañia: 'IBERDROLA', tarifa: 'PLAN ESTABLE', precio_kwh: 0.132, comision_kwh: 0.004 },
      { id: 3, compañia: 'AXPO', tarifa: 'INDEXADO FLEX', precio_kwh: 0.128, comision_kwh: 0.0025 },
    ];

    const resultadosCalculados = tarifas.map((t) => {
      const coste = consumoTotal * t.precio_kwh;
      const ahorro = facturaNum - coste;
      const ahorroPct = (ahorro / facturaNum) * 100;
      const comision = (parseFloat(consumoAnual) || 0) * t.comision_kwh;
      return { ...t, consumoTotal, coste, ahorro, ahorroPct, comision };
    });

    setResultados(resultadosCalculados);

    try {
      const res = await fetch('/api/comparativas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: { nombre: nombreCliente, direccion: direccionCliente },
          agenteId: parseInt(idAgenteQR || '1'),
          lugarId: parseInt(idLugarQR || '1'),
          datosFactura: {
            tipoCliente, tipoTarifa, nombreTarifa, cups, fechaInicio, fechaFin, consumoPeriodos,
            potencias, consumoAnual, importeFactura, iva, impuestoElectricidad, territorio,
            reactiva, exceso, alquiler, otros
          },
          resultados: resultadosCalculados
        }),
      });
      const data = await res.json();
      console.log('Comparativa guardada con éxito:', data);
    } catch (error) {
      console.error('Error al guardar la comparativa:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 p-4 md:p-6">
      {/* LOGO y NOMBRE */}

      {/* SELECTOR DE PESTAÑAS CON BLOQUE VISUAL Y ANIMACIÓN */}
      <div className="w-full bg-[#4CAF50] text-white rounded-lg p-4 mb-6 flex flex-col md:flex-row justify-between items-center shadow">
        <div className="flex space-x-4 mb-4 md:mb-0">
          {['luz', 'gas', 'telefonia'].map((tipo) => (
            <button
              key={tipo}
              onClick={() => setTipoComparador(tipo as any)}
              className={`px-6 py-2 rounded-full font-semibold shadow transition-all duration-200 ${
                tipoComparador === tipo
                  ? 'bg-yellow-400 text-black'
                  : 'bg-orange-500 text-black hover:bg-yellow-500'
              }`}
            >
              {tipo === 'luz' && '⚡ Luz'}
              {tipo === 'gas' && '🔥 Gas'}
              {tipo === 'telefonia' && '📞 Telefonía'}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3 text-lg font-semibold text-white">
          <span className="animate-bounce text-2xl">⬅️</span>
          <span>Elige el tipo de comparativa que quieres hacer</span>
        </div>
      </div>

      {/* CONTENIDO SEGÚN TIPO */}
      {tipoComparador === 'luz' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Aquí va todo el contenido del formulario, resultados y gráfica */}
          {/* Ya lo tienes implementado, así que puedes pegar tu bloque original completo */}
        </div>
      )}

      {tipoComparador === 'gas' && (
        <div className="text-center text-gray-600 font-medium p-10 border rounded-lg bg-gray-50">
          🔥 Comparador de Gas disponible próximamente
        </div>
      )}

      {tipoComparador === 'telefonia' && (
        <div className="text-center text-gray-600 font-medium p-10 border rounded-lg bg-gray-50">
          📞 Comparador de Telefonía disponible próximamente
        </div>
      )}
    </div>
  );
}