function Sidebar({ country, countryData, loading }) {
  return (
    <div className="w-80 h-full bg-gray-900 text-white p-6 flex flex-col overflow-y-auto">
      
      <h1 className="text-lg font-bold mb-6 text-gray-400 tracking-widest uppercase">
        World Data Explorer
      </h1>

      {!country && (
        <p className="text-gray-500 text-sm mt-4">
          Click on any country on the map to explore its data.
        </p>
      )}

      {loading && (
        <p className="text-gray-400 text-sm mt-4">Loading...</p>
      )}

      {countryData && !loading && (
        <div className="flex flex-col gap-4">
          
          {/* Bandera y nombre */}
          <div className="flex items-center gap-3">
            <img
              src={countryData.flags.svg}
              alt={`Flag of ${countryData.name.common}`}
              className="w-12 h-8 object-cover rounded"
            />
            <div>
              <h2 className="text-xl font-bold">{countryData.name.common}</h2>
              <p className="text-gray-400 text-xs">{countryData.name.official}</p>
            </div>
          </div>

          <hr className="border-gray-700" />

          {/* Datos principales */}
          <div className="flex flex-col gap-3">
            <DataRow label="Capital" value={countryData.capital?.[0] ?? 'N/A'} />
            <DataRow label="Region" value={`${countryData.subregion}, ${countryData.region}`} />
            <DataRow
              label="Population"
              value={countryData.population.toLocaleString('en-US')}
            />
            <DataRow
              label="Area"
              value={`${countryData.area.toLocaleString('en-US')} km²`}
            />
            <DataRow
              label="Languages"
              value={Object.values(countryData.languages ?? {}).join(', ')}
            />
            <DataRow
              label="Currency"
              value={
                Object.values(countryData.currencies ?? {})
                  .map(c => `${c.name} (${c.symbol})`)
                  .join(', ')
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}

function DataRow({ label, value }) {
  return (
    <div>
      <p className="text-gray-500 text-xs uppercase tracking-wider">{label}</p>
      <p className="text-white text-sm mt-0.5">{value}</p>
    </div>
  )
}

export default Sidebar