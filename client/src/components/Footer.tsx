import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">FindTogether</h3>
            <p className="text-gray-400">
              Working together to protect and find missing children.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/find">
                  <a className="text-gray-400 hover:text-white transition-colors">
                    Find Now
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/mission">
                  <a className="text-gray-400 hover:text-white transition-colors">
                    Mission
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Take Action</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Report Case
                </a>
              </li>
              <li>
                <Link href="/safe-zones">
                  <a className="text-gray-400 hover:text-white transition-colors">
                    Safe Zones Map
                  </a>
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Join Community
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <p className="text-gray-400">
              Email: support@findtogether.org<br />
              Emergency: +1 (800) 123-4567
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} FindTogether. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}