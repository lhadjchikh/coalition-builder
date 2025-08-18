"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import debounce from "lodash/debounce";

interface AddressSuggestion {
  text: string;
  place_id: string;
}

interface AddressComponents {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
}

interface AddressAutocompleteProps {
  onAddressSelect: (components: AddressComponents) => void;
  initialValue?: string;
  placeholder?: string;
  required?: boolean;
  testId?: string;
  debounceDelay?: number;
}

export default function AddressAutocomplete({
  onAddressSelect,
  initialValue = "",
  placeholder = "Start typing your address...",
  required = false,
  testId = "address-autocomplete",
  debounceDelay = 300,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounced search function
  const searchAddresses = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 3) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/address/suggestions?q=${encodeURIComponent(searchQuery)}&limit=5`
        );

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        } else {
          console.error("Failed to fetch suggestions");
          setSuggestions([]);
        }
      } catch (error) {
        console.error("Error fetching address suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, debounceDelay),
    [debounceDelay]
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    searchAddresses(value);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = async (suggestion: AddressSuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    setSuggestions([]);

    // Fetch detailed address components
    try {
      const response = await fetch(
        `/api/address/place/${encodeURIComponent(suggestion.place_id)}`
      );

      if (response.ok) {
        const addressComponents = await response.json();
        onAddressSelect(addressComponents);
      } else {
        console.error("Failed to fetch place details");
        // Fallback: let user enter manually
        onAddressSelect({
          street_address: suggestion.text,
          city: "",
          state: "",
          zip_code: "",
        });
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
      // Fallback: let user enter manually
      onAddressSelect({
        street_address: suggestion.text,
        city: "",
        state: "",
        zip_code: "",
      });
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="address-autocomplete-wrapper" ref={wrapperRef}>
      <div className="input-wrapper">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          required={required}
          data-testid={testId}
          className="address-input"
          autoComplete="off"
        />
        {loading && (
          <div className="loading-indicator" aria-label="Loading suggestions">
            <span className="spinner"></span>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul className="suggestions-list" role="listbox">
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.place_id}
              onClick={() => handleSelectSuggestion(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`suggestion-item ${
                index === selectedIndex ? "selected" : ""
              }`}
              role="option"
              aria-selected={index === selectedIndex}
              data-testid={`suggestion-${index}`}
            >
              <svg
                className="location-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{suggestion.text}</span>
            </li>
          ))}
        </ul>
      )}

      <style jsx>{`
        .address-autocomplete-wrapper {
          position: relative;
          width: 100%;
        }

        .input-wrapper {
          position: relative;
        }

        .address-input {
          width: 100%;
          padding: 0.5rem;
          font-size: 1rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .loading-indicator {
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
        }

        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .suggestions-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          max-height: 200px;
          overflow-y: auto;
          background: white;
          border: 1px solid #ddd;
          border-top: none;
          border-radius: 0 0 4px 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .suggestion-item {
          display: flex;
          align-items: center;
          padding: 0.5rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .suggestion-item:hover,
        .suggestion-item.selected {
          background-color: #f5f5f5;
        }

        .location-icon {
          margin-right: 0.5rem;
          color: #666;
          flex-shrink: 0;
        }

        .suggestion-item span {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
