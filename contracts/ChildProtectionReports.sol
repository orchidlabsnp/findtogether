// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ChildProtectionReports is Ownable, ReentrancyGuard {
    struct Report {
        uint256 id;
        string caseType;
        string childName;
        uint256 age;
        string location;
        string description;
        string contactInfo;
        address reporter;
        uint256 timestamp;
        string status;
        string aiCharacteristics;
        bool isVerified;
    }

    // Mapping from report ID to Report struct
    mapping(uint256 => Report) public reports;
    uint256 public reportCount;

    // Events
    event ReportCreated(
        uint256 indexed reportId,
        string caseType,
        string location,
        address indexed reporter,
        uint256 timestamp
    );

    event ReportStatusUpdated(
        uint256 indexed reportId,
        string newStatus,
        uint256 timestamp
    );

    event ReportVerified(
        uint256 indexed reportId,
        address indexed verifier,
        uint256 timestamp
    );

    constructor() Ownable(msg.sender) {}

    function createReport(
        string memory _caseType,
        string memory _childName,
        uint256 _age,
        string memory _location,
        string memory _description,
        string memory _contactInfo,
        string memory _aiCharacteristics
    ) external nonReentrant returns (uint256) {
        reportCount++;
        
        reports[reportCount] = Report({
            id: reportCount,
            caseType: _caseType,
            childName: _childName,
            age: _age,
            location: _location,
            description: _description,
            contactInfo: _contactInfo,
            reporter: msg.sender,
            timestamp: block.timestamp,
            status: "OPEN",
            aiCharacteristics: _aiCharacteristics,
            isVerified: false
        });

        emit ReportCreated(
            reportCount,
            _caseType,
            _location,
            msg.sender,
            block.timestamp
        );

        return reportCount;
    }

    function updateReportStatus(uint256 _reportId, string memory _newStatus) 
        external 
        onlyOwner 
    {
        require(_reportId <= reportCount && _reportId > 0, "Invalid report ID");
        reports[_reportId].status = _newStatus;
        
        emit ReportStatusUpdated(_reportId, _newStatus, block.timestamp);
    }

    function verifyReport(uint256 _reportId) 
        external 
        onlyOwner 
    {
        require(_reportId <= reportCount && _reportId > 0, "Invalid report ID");
        require(!reports[_reportId].isVerified, "Report already verified");
        
        reports[_reportId].isVerified = true;
        
        emit ReportVerified(_reportId, msg.sender, block.timestamp);
    }

    function getReport(uint256 _reportId) 
        external 
        view 
        returns (Report memory) 
    {
        require(_reportId <= reportCount && _reportId > 0, "Invalid report ID");
        return reports[_reportId];
    }

    function getReportCount() external view returns (uint256) {
        return reportCount;
    }
}
