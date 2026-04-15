import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { useTranslation } from "react-i18next";

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled down 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-110 flex items-center justify-center group animate-fade-in"
          aria-label={t('accessibility.back_to_top')}
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
        </button>
      )}
    </>
  );
};

export default BackToTop;
