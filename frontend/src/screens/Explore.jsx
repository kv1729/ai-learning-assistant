function Explore() {
  return (
    <div className="min-h-screen bg-white p-6 pb-24">
      <h1 className="text-3xl font-bold mb-6">Explore</h1>

      <input
        type="text"
        placeholder="Search topics..."
        className="w-full p-4 rounded-xl bg-gray-100 mb-6"
      />

      <div className="space-y-4">
        <div className="p-4 border rounded-xl">Data Science</div>
        <div className="p-4 border rounded-xl">Programming</div>
        <div className="p-4 border rounded-xl">Finance</div>
        <div className="p-4 border rounded-xl">Mathematics</div>
      </div>
    </div>
  )
}

export default Explore