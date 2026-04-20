const stats = [
  { value: "2,000+", label: "Active Opportunities" },
  { value: "500+",   label: "Partner Companies" },
  { value: "10k+",   label: "Graduates Placed" },
  { value: "95%",    label: "Success Rate" },
];

export function Stats() {
  return (
    <section className="bg-neutral-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-neutral-700">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center px-4">
            <p className="font-headline font-bold text-4xl text-[#78fbb6] mb-2">
              {stat.value}
            </p>
            <p className="text-sm text-neutral-400">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
