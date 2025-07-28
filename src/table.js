import React, { useMemo, useState } from "react";
import { FiEye, FiEyeOff, FiMaximize2 } from "react-icons/fi";
import "./table.css";


const AddressList = ({nodes, selectedId, onToggleVisible}) => {
  const [search, setSearch] = useState("");

  const filtered  = useMemo(() => {
    console.log('nodes', nodes);
    
    return nodes.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );
  }, [nodes, search])
 
  const onOff = (id) => {
    onToggleVisible(id)
  }

  return (
    <div className="address-list">
      <div className="address-list-header">
        <h2>Address List</h2>
        <FiMaximize2 className="icon-btn" />
      </div>

      {/* Search */}
      <div className="search-wrapper">
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="search-icon">🔍</span>
      </div>

      {/* Filters */}
      <div className="filters">
        <label>
          <input type="checkbox" /> Show contracts
        </label>
        <label>
          <input type="checkbox" /> Show exchanges
        </label>
      </div>

      {/* Header row */}
      <div className="table-header">
        <span>Address</span>
        <span>Share of USDT supply</span>
      </div>

      {/* Rows */}
      <div className="address-rows">
        {filtered.map((item) => (
          <div
            className={`address-row ${
              selectedId === item.id ? "selected" : ""
            }`}
            key={item.id}
          >
            <div className="address-info">
              {item.visible ? (
                <FiEye className="icon visible" onClick={() => onOff(item.id)}/>
              ) : (
                <FiEyeOff className="icon hidden" onClick={() => onOff(item.id)}/>
              )}
              <span className="address-id">#{item.id}</span>
              <span className="address-name">{item.name}</span>
            </div>
            <span className="address-share">{item.share}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddressList;
