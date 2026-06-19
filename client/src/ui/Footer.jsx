import footerBanner from '../assets/footer-banner.png';

function Footer() {
  return (
    <footer style={{ width: '100%', marginTop: '2rem' }}>
      <img 
        src={footerBanner} 
        alt="Last Race Footer Banner" 
        style={{ width: '100%', height: 'auto', display: 'block' }} 
      />
      <div className="text-center text-muted mt-2 mb-3">
        <p className="footer-text">
          &copy; 2026 Web Applications I - Last Race | s360760
        </p>
      </div>
    </footer>
  );
}

export default Footer;