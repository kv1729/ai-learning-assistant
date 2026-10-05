function Profile() {
  return (
    <div className="min-h-screen bg-white p-6 pb-24">
      <h1 className="text-3xl font-bold mb-4">Kunal</h1>

      <div className="bg-orange-100 p-4 rounded-xl mb-6">
        <h2 className="text-xl font-bold">18 Day Streak 🔥</h2>
      </div>

      <div className="space-y-4">
        <div className="p-4 border rounded-xl">Cards Completed: 26</div>
        <div className="p-4 border rounded-xl">Active Topics: 3</div>
        <div className="p-4 border rounded-xl">Saved Concepts: 12</div>
        <div className="p-4 border rounded-xl">Weak Areas: Gradient Descent</div>
      </div>
    </div>
  )
}

export default Profile