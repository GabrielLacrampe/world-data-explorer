function Sidebar({ country }) {
  return (
    <div className="w-80 h-full bg-gray-900 text-white p-6 flex flex-col">
      <h1 className="text-xl font-bold mb-6 text-gray-300">
        World Data Explorer
      </h1>
      
      {country ? (
        <div>
          <h2 className="text-2xl font-bold">{country.name}</h2>
          <p className="text-gray-400 mt-2">Click a country to explore its data</p>
        </div>
      ) : (
        <p className="text-gray-500">Click on any country on the map</p>
      )}
    </div>
  )
}

export default Sidebar