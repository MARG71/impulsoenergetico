'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import Image from 'next/image';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function ComparadorContenido() {
  const searchParams = useSearchParams();
  const [agenteId, setAgenteId] = useState<string | null>(null);
  const [lugarId, setLugarId] = useState<string | null>(null);

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
    const urlAgente = searchParams.get('agenteId');
    const urlLugar = searchParams.get('lugarId');

    if (urlAgente && urlLugar) {
      localStorage.setItem('agenteId', urlAgente);
      localStorage.setItem('lugarId', urlLugar);
      setAgenteId(urlAgente);
      setLugarId(urlLugar);
    } else {
      const storedAgente = localStorage.getItem('agenteId');
      const storedLugar = localStorage.getItem('lugarId');
      if (storedAgente) setAgenteId(storedAgente);
      if (storedLugar) setLugarId(storedLugar);
    }
  }, [searchParams]);

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
          
          {/* FORMULARIO */}
          <div className="bg-[#4CAF50] text-white p-6 rounded shadow-lg space-y-4">

            <div className="flex flex-col items-center justify-center mb-4 space-y-2">
              <Image src="/logo-impulso.jpeg" alt="Logo Impulso" width={120} height={120} />
            </div>

            <h2 className="text-xl font-bold mb-2">Datos para la Comparativa</h2>
            <form onSubmit={handleSubmit} className="space-y-3">

              <div>

                <div>
                  <label className="block text-sm font-semibold">Nombre del cliente</label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    className="w-full p-2 rounded bg-white text-black"
                    value={nombreCliente}
                    onChange={(e) => setNombreCliente(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold">Dirección completa</label>
                  <input
                    type="text"
                    placeholder="Calle, número, ciudad, CP..."
                    className="w-full p-2 rounded bg-white text-black"
                    value={direccionCliente}
                    onChange={(e) => setDireccionCliente(e.target.value)}
                  />
                </div>

                <label className="block text-sm font-semibold">Tipo de cliente</label>
                <select className="w-full p-2 rounded bg-white text-black" value={tipoCliente} onChange={(e) => setTipoCliente(e.target.value)}>
                  <option value="particular">Particular</option>
                  <option value="autonomo">Autónomo</option>
                  <option value="empresa">Empresa</option>
                  <option value="comunidad">Comunidad</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold">Tipo de tarifa</label>
                <select className="w-full p-2 rounded bg-white text-black" value={tipoTarifa} onChange={(e) => setTipoTarifa(e.target.value)}>
                  <option value="fija">Fija</option>
                  <option value="indexada">Indexada</option>
                  <option value="ambas">Ambas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold">Nombre de tarifa</label>
                <select className="w-full p-2 rounded bg-white text-black" value={nombreTarifa} onChange={(e) => setNombreTarifa(e.target.value)}>
                  
                    <option value="2.0TD">2.0TD</option>
                    <option value="3.0TD">3.0TD</option>
                    <option value="6.1TD">6.1TD</option>
                    <option value="6.2TD">6.2TD</option>
                  
                  
                </select>
              </div>

              <input type="text" placeholder="CUPS (opcional)" className="w-full p-2 rounded bg-white text-black" value={cups} onChange={(e) => setCups(e.target.value)} />
              <input type="date" className="w-full p-2 rounded bg-white text-black" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              <input type="date" className="w-full p-2 rounded bg-white text-black" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />

              <div>
                <label className="block text-sm font-semibold mb-1">Consumo por periodos (kWh)</label>
                <div className="grid grid-cols-3 gap-3">
                  {periodosConsumo.map(p => (
                    <div key={p} className="space-y-1">
                      <label className="text-xs">Periodo {p}</label>
                      <input type="number" className="w-full p-2 rounded bg-white text-black text-sm" value={consumoPeriodos[p]} onChange={(e) => handlePeriodoChange(e, p)} />
                    </div>
                  ))}
                </div>
              </div>

              <input type="text" readOnly placeholder="Consumo anual (kWh)" className="w-full p-2 rounded bg-gray-100 text-black" value={consumoAnual} />

              <div>
                <label className="block text-sm font-semibold mb-1">Potencia contratada (kW)</label>
                <div className="grid grid-cols-3 gap-3">
                  {periodosPotencia.map(p => (
                    <div key={p} className="space-y-1">
                      <label className="text-xs">Periodo {p}</label>
                      <input type="number" className="w-full p-2 rounded bg-white text-black text-sm" value={potencias[p]} onChange={(e) => handlePotenciaChange(e, p)} />
                    </div>
                  ))}
                </div>
              </div>

              <select className="w-full p-2 rounded bg-white text-black" value={impuestoElectricidad} onChange={(e) => setImpuestoElectricidad(e.target.value)}>
                <option value="5.113">Impuesto Electricidad: 5,113%</option>
                <option value="3.8">3,8%</option>
                <option value="2.5">2,5%</option>
                <option value="0.5">0,5%</option>
              </select>

              <select className="w-full p-2 rounded bg-white text-black" value={territorio} onChange={(e) => setTerritorio(e.target.value)}>
                <option value="peninsula">Territorio: Península</option>
                <option value="baleares">Baleares</option>
                <option value="canarias">Canarias</option>
                <option value="melilla">Melilla</option>
                <option value="ceuta">Ceuta</option>
              </select>

              <input type="number" placeholder="Importe total factura (€)" className="w-full p-2 rounded bg-white text-black" value={importeFactura} onChange={(e) => setImporteFactura(e.target.value)} />
              <input type="number" placeholder="Reactiva (€)" className="w-full p-2 rounded bg-white text-black" value={reactiva} onChange={(e) => setReactiva(e.target.value)} />
              <input type="number" placeholder="Exceso de potencia (€)" className="w-full p-2 rounded bg-white text-black" value={exceso} onChange={(e) => setExceso(e.target.value)} />
              <input type="number" placeholder="Alquiler contador (€)" className="w-full p-2 rounded bg-white text-black" value={alquiler} onChange={(e) => setAlquiler(e.target.value)} />
              <input type="number" placeholder="Otros conceptos (€)" className="w-full p-2 rounded bg-white text-black" value={otros} onChange={(e) => setOtros(e.target.value)} />

              <button type="submit" className="w-full bg-yellow-400 text-black py-2 rounded font-bold hover:bg-yellow-500">
                Ver ofertas
              </button>
            </form>
          </div>

          {/* RESULTADOS CON ORDENACIÓN Y ESTILO IMPULSO */}
          <div className="bg-[#FFF59D] p-4 rounded shadow-md md:col-span-2">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
              <h2 className="text-lg font-bold text-green-800">Resultados</h2>
              {(nombreCliente || direccionCliente) && (
                
                <div className="text-sm text-gray-700 md:text-right mt-2 md:mt-0">
                  {nombreCliente && <div><strong>Cliente:</strong> {nombreCliente}</div>}
                  {direccionCliente && <div><strong>Dirección:</strong> {direccionCliente}</div>}
                  
                  {nombreAgente && <div><strong>Agente:</strong> {nombreAgente}</div>}
                  {nombreLugar && <div><strong>Lugar:</strong> {nombreLugar}</div>}
                  {agenteId && <div className="text-xs text-gray-500">ID Agente: {agenteId}</div>}
                  {lugarId && <div className="text-xs text-gray-500">ID Lugar: {lugarId}</div>}

                </div>

              )}
            </div>

            {/* BOTONES DE ORDENACIÓN */}

            <div className="flex flex-wrap items-center justify-between mb-4">
              <div className="flex flex-wrap gap-2">
                <button onClick={() => ordenarResultados('compañia')} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                  Ordenar por Compañía
                </button>
                <button onClick={() => ordenarResultados('ahorro')} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                  Ordenar por Ahorro
                </button>
                <button onClick={() => ordenarResultados('comision')} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                  Ordenar por Comisión
                </button>
              </div>

              <div className="mt-2 md:mt-0">
                <button
                  onClick={() => setMostrarGrafica(!mostrarGrafica)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 shadow"
                >
                  📊 Ver gráfica
                </button>
              </div>
            </div>

            {mostrarGrafica && (
              <div className="bg-white p-4 rounded shadow mb-6">
                <h3 className="text-md font-bold text-center mb-4 text-green-800">Comparativa Visual de Ahorro y Comisión</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={resultados} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <XAxis dataKey="compañia" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="ahorro" fill="#FFA000" name="Ahorro (€)" />
                    <Bar dataKey="comision" fill="#4CAF50" name="Comisión (€)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {resultados.length === 0 ? (
              <p className="text-sm text-gray-700">Los resultados aparecerán aquí...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto text-sm text-left border-separate border-spacing-y-2">
                  <thead className="bg-yellow-300 text-gray-800">
                    <tr>
                      <th className="px-4 py-2 font-semibold">#</th>
                      <th className="px-4 py-2 font-semibold">Compañía</th>
                      <th className="px-4 py-2 font-semibold">Nombre tarifa</th>
                      <th className="px-4 py-2 font-semibold text-right">Coste factura</th>
                      <th className="px-4 py-2 font-semibold text-right">Ahorro</th>
                      <th className="px-4 py-2 font-semibold text-right">Comisión</th>
                    </tr>
                  </thead>

                  <tbody className="bg-yellow-100">
                      {resultados.map((r, i) => (
                        <tr key={r.id} className="bg-white rounded shadow-md">
                          <td className="px-4 py-2 font-bold text-gray-600">#{i + 1}</td>
                          <td className="px-4 py-2 font-semibold text-gray-800">{r.compañia}</td>
                          <td className="px-4 py-2 text-gray-700">{r.tarifa}</td>
                          <td className="px-4 py-2 text-right font-semibold text-gray-800">{r.coste.toFixed(2)} €</td>
                          <td className="px-4 py-2 text-right">
                            <span className="text-green-700 font-semibold">{r.ahorro.toFixed(2)} €</span><br />
                            <span className="text-pink-600 font-bold text-sm">{r.ahorroPct.toFixed(0)}%</span>
                          </td>
                          <td className="px-4 py-2 text-right text-blue-700 font-semibold">{r.comision.toFixed(2)} €</td>
                          <td className="px-4 py-2 text-right space-x-2">
                            <button
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                              onClick={() => alert(`Contratar ${r.compañia}`)}
                            >
                              Contratar
                            </button>
                            <button
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                              onClick={() => alert(`Descargar PDF para ${r.compañia}`)}
                            >
                              PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>

                </table>
              </div>
            )}
          </div>

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


